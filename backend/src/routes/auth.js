const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await getAsync(
      `SELECT id, email, name, role, region FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Login failed", error: e.message });
  }
});

module.exports = router;
