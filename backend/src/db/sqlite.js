const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "velion-dkn.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("SQLite connection error:", err.message);
  else console.log("SQLite connected:", dbPath);
});

// helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('CONSULTANT','CHAMPION','ADMIN')) NOT NULL DEFAULT 'CONSULTANT',
      region TEXT NOT NULL,
      expertise TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // seed 3 users (only if table empty)
  const row = await get(`SELECT COUNT(*) AS c FROM users`);
  if (row.c === 0) {
    await run(
      `INSERT INTO users (email, password, name, role, region, expertise) VALUES
        ('consultant@velion.com', 'pass123', 'John Consultant', 'CONSULTANT', 'EU', 'React,Frontend'),
        ('champion@velion.com',   'pass123', 'Sarah Champion',  'CHAMPION',   'EU', 'Governance,Quality'),
        ('admin@velion.com',      'pass123', 'Admin User',      'ADMIN',      'GLOBAL', 'User Management')`
    );
    console.log("Seeded 3 default users (consultant/champion/admin).");
  }
}

initDb().catch((e) => console.error("DB init failed:", e));

module.exports = db;
