const db = require("../db/sqlite");

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function requireUser(req, res, next) {
  try {
    const userIdRaw = req.header("x-user-id");
    if (!userIdRaw) {
      return res.status(401).json({ message: "Missing x-user-id header" });
    }
    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId)) {
      return res.status(401).json({ message: "Invalid x-user-id" });
    }

    const user = await getAsync(
      `SELECT id, email, name, role, region FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ message: "Auth failed", error: e.message });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Requires role: ${roles.join(", ")}` });
    }
    next();
  };
}

module.exports = { requireUser, requireRole };
