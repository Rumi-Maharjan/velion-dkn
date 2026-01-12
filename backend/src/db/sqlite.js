const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, "velion-dkn.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("SQLite connection error:", err.message);
  else console.log("SQLite connected:", dbPath);
});

// --- helpers ---
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
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function ensureColumn(table, column, ddlFragment) {
  const cols = await all(`PRAGMA table_info(${table})`);
  const exists = cols.some((c) => c.name === column);
  if (!exists) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddlFragment}`);
    console.log(`Added column: ${table}.${column}`);
  }
}

async function seedUsersIfEmpty() {
  const row = await get(`SELECT COUNT(*) as c FROM users`);
  if (row.c > 0) return;

  await run(
    `INSERT INTO users (email, password, name, role, region, expertise) VALUES
      ('consultant@velion.com', 'pass123', 'John Consultant', 'CONSULTANT', 'EU', 'React,Frontend'),
      ('champion@velion.com', 'pass123', 'Sarah Champion', 'CHAMPION', 'EU', 'Knowledge Governance'),
      ('admin@velion.com', 'pass123', 'Admin User', 'ADMIN', 'GLOBAL', 'System Admin')`
  );
  console.log("Seeded sample users.");
}

async function initDb() {
  // Users table (CW1 User hierarchy simplified via role field)
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

  // Existing documents table (acts as content_items)
  await run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      tags TEXT,
      author TEXT,
      region TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Upgrade documents table to cover more of your CW1 ContentItem model
  await ensureColumn("documents", "type", "TEXT DEFAULT 'DOCUMENT'"); // DOCUMENT | TEMPLATE
  await ensureColumn("documents", "description", "TEXT");
  await ensureColumn("documents", "project_ref", "TEXT");
  await ensureColumn("documents", "uploaded_by", "INTEGER");
  await ensureColumn("documents", "validated_by", "INTEGER");
  await ensureColumn("documents", "validation_feedback", "TEXT");
  await ensureColumn("documents", "validated_at", "TEXT");

  await seedUsersIfEmpty();
}

initDb().catch((e) => console.error("DB init failed:", e));

module.exports = db;
