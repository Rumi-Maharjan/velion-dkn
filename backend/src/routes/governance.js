const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser, requireRole } = require("../services/authService");

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

/**
 * GET pending content (Champion/Admin only)
 */
router.get("/pending", requireUser, requireRole("CHAMPION", "ADMIN"), async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT * FROM content_items WHERE status = 'PENDING' ORDER BY created_at DESC`
    );

    rows.forEach(r => {
      try {
        r.tags = r.tags ? JSON.parse(r.tags) : [];
      } catch {
        r.tags = [];
      }
    });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * APPROVE content
 */
router.post("/:id/approve", requireUser, requireRole("CHAMPION", "ADMIN"), async (req, res) => {
  try {
    await runAsync(
      `UPDATE content_items SET status = 'APPROVED' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Content approved" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

/**
 * REJECT content
 */
router.post("/:id/reject", requireUser, requireRole("CHAMPION", "ADMIN"), async (req, res) => {
  try {
    await runAsync(
      `UPDATE content_items SET status = 'REJECTED' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: "Content rejected" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
