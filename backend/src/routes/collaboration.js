const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser } = require("../services/authService");

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function isWorkspaceOwner(workspaceId, userId) {
  const row = await getAsync(
    `SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
    [workspaceId, userId]
  );
  return row?.role === "OWNER";
}

/**
 * Create workspace (any logged-in user)
 * POST /api/collaboration/workspaces
 */
router.post("/workspaces", requireUser, async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });

    const ws = await runAsync(
      `INSERT INTO workspaces (name, description, created_by) VALUES (?, ?, ?)`,
      [name, description || "", req.user.id]
    );

    // creator becomes OWNER
    await runAsync(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'OWNER')`,
      [ws.id, req.user.id]
    );

    res.status(201).json({ message: "Workspace created", id: ws.id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * List my workspaces
 * GET /api/collaboration/workspaces
 */
router.get("/workspaces", requireUser, async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT w.*, wm.role AS my_role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * Add member (OWNER only)
 * POST /api/collaboration/workspaces/:id/members
 * body: { userId }
 */
router.post("/workspaces/:id/members", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const owner = await isWorkspaceOwner(workspaceId, req.user.id);
    if (!owner) return res.status(403).json({ message: "Only OWNER can add members" });

    await runAsync(
      `INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role)
       VALUES (?, ?, 'MEMBER')`,
      [workspaceId, Number(userId)]
    );

    res.json({ message: "Member added" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * View members
 * GET /api/collaboration/workspaces/:id/members
 */
router.get("/workspaces/:id/members", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);

    // only members can view
    const me = await getAsync(
      `SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.id]
    );
    if (!me) return res.status(403).json({ message: "Not a member of this workspace" });

    const rows = await allAsync(
      `SELECT u.id, u.name, u.email, u.role, u.region, wm.role as workspace_role
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY wm.role DESC, u.name ASC`,
      [workspaceId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * Share content into workspace (members)
 * POST /api/collaboration/workspaces/:id/share
 * body: { contentId, note }
 */
router.post("/workspaces/:id/share", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);
    const { contentId, note } = req.body || {};
    if (!contentId) return res.status(400).json({ message: "contentId is required" });

    // ✅ Only members can share (KEEP this)
    const me = await getAsync(
      `SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.id]
    );
    if (!me) return res.status(403).json({ message: "Not a member of this workspace" });

    // ✅ Get content status + owner
    const content = await getAsync(
      `SELECT id, status, created_by FROM content_items WHERE id = ?`,
      [Number(contentId)]
    );
    if (!content) return res.status(404).json({ message: "Content not found" });

    // ✅ Rules:
    // Admin/Champion can share ANY status
    // Consultant can share APPROVED OR their own uploads (any status)
    const isGov = req.user.role === "ADMIN" || req.user.role === "CHAMPION";
    const isOwner = content.created_by === req.user.id;

    if (!isGov) {
      const allowed = content.status === "APPROVED" || isOwner;
      if (!allowed) {
        return res.status(403).json({
          message: "You can only share approved content or your own uploads.",
        });
      }
    }

    await runAsync(
      `INSERT OR REPLACE INTO workspace_content (workspace_id, content_id, shared_by, note)
       VALUES (?, ?, ?, ?)`,
      [workspaceId, Number(contentId), req.user.id, note || ""]
    );

    res.json({ message: "Content shared" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * View shared content
 * GET /api/collaboration/workspaces/:id/content
 */
router.get("/workspaces/:id/content", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);

    // only members can view
    const me = await getAsync(
      `SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.id]
    );
    if (!me) return res.status(403).json({ message: "Not a member of this workspace" });

    const rows = await allAsync(
      `SELECT 
        ci.*,
        wc.workspace_id,
        wc.shared_by,
        wc.shared_at,
        wc.note,
        u.name as shared_by_name
    FROM workspace_content wc
    JOIN content_items ci ON ci.id = wc.content_id
    JOIN users u ON u.id = wc.shared_by
    WHERE wc.workspace_id = ?
    ORDER BY wc.shared_at ASC`,
      [workspaceId]
    );

    rows.forEach(r => {
      try { r.tags = r.tags ? JSON.parse(r.tags) : []; } catch { r.tags = []; }
    });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * GET workspace messages (members only)
 * GET /api/collaboration/workspaces/:id/messages
 */
router.get("/workspaces/:id/messages", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);

    const me = await getAsync(
      `SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.id]
    );
    if (!me) return res.status(403).json({ message: "Not a member of this workspace" });

    const rows = await allAsync(
      `SELECT wm.id, wm.user_id, wm.message, wm.created_at, u.name as author_name
       FROM workspace_messages wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?
       ORDER BY wm.created_at ASC
       LIMIT 200`,
      [workspaceId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * POST workspace message (members only)
 * POST /api/collaboration/workspaces/:id/messages
 * body: { message }
 */
router.post("/workspaces/:id/messages", requireUser, async (req, res) => {
  try {
    const workspaceId = Number(req.params.id);
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const me = await getAsync(
      `SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
      [workspaceId, req.user.id]
    );
    if (!me) return res.status(403).json({ message: "Not a member of this workspace" });

    await runAsync(
      `INSERT INTO workspace_messages (workspace_id, user_id, message)
       VALUES (?, ?, ?)`,
      [workspaceId, req.user.id, message.trim()]
    );

    res.status(201).json({ message: "Message posted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


module.exports = router;
