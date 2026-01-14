const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser } = require("../services/authService");

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// GET /api/content-items/search?q=gdpr
router.get("/search", requireUser, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    // Admin/Champion: can see everything
    const isGov = req.user.role === "ADMIN" || req.user.role === "CHAMPION";

    let sql = `
      SELECT id, title, type, status, region, created_by
      FROM content_items
      WHERE (title LIKE ? OR tags LIKE ?)
    `;
    const params = [`%${q}%`, `%${q}%`];

    if (!isGov) {
      // Consultant: only approved + their own uploads
      sql += ` AND (status = 'APPROVED' OR created_by = ?)`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY created_at DESC LIMIT 10`;

    const rows = await allAsync(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
