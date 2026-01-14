const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser } = require("../services/authService");

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// GET /api/users/search?q=rumi
router.get("/search", requireUser, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const rows = await allAsync(
      `SELECT id, name, email, role, region
       FROM users
       WHERE name LIKE ? OR email LIKE ?
       ORDER BY name ASC
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
