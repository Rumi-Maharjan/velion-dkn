const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser, requireRole } = require("../services/authService");

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

// All admin endpoints require logged in + ADMIN role
router.use(requireUser);
router.use(requireRole("ADMIN"));

// GET /api/admin/users  (list users)
router.get("/users", async (req, res) => {
  try {
    const users = await allAsync(
      `SELECT id, email, name, role, region, expertise, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ users });
  } catch (e) {
    res.status(500).json({ message: "Failed to list users", error: e.message });
  }
});

// POST /api/admin/users  (create user)
router.post("/users", async (req, res) => {
  try {
    const { email, password, name, role, region, expertise } = req.body || {};

    if (!email || !password || !name || !role || !region) {
      return res.status(400).json({
        message: "email, password, name, role, region are required",
      });
    }

    const allowedRoles = ["CONSULTANT", "CHAMPION", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "role must be CONSULTANT, CHAMPION, or ADMIN" });
    }

    // prevent duplicates
    const existing = await getAsync(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const result = await runAsync(
      `INSERT INTO users (email, password, name, role, region, expertise)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, password, name, role, region, expertise || ""]
    );

    res.status(201).json({
      message: "User created",
      userId: result.id,
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to create user", error: e.message });
  }
});

// PUT /api/admin/users/:id  (update user)
router.put("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, role, region, expertise } = req.body || {};

    if (!userId || !name || !role || !region) {
      return res.status(400).json({ message: "id, name, role, region are required" });
    }

    const allowedRoles = ["CONSULTANT", "CHAMPION", "ADMIN"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "role must be CONSULTANT, CHAMPION, or ADMIN" });
    }

    await runAsync(
      `UPDATE users SET name = ?, role = ?, region = ?, expertise = ? WHERE id = ?`,
      [name, role, region, expertise || "", userId]
    );

    res.json({ message: "User updated" });
  } catch (e) {
    res.status(500).json({ message: "Failed to update user", error: e.message });
  }
});

// DELETE /api/admin/users/:id  (delete user)
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: "invalid id" });

    await runAsync(`DELETE FROM users WHERE id = ?`, [userId]);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete user", error: e.message });
  }
});

module.exports = router;
