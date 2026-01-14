const db = require("./sqlite");

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID });
    });
  });
}

async function initContentTable() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('DOCUMENT','TEMPLATE')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      region TEXT NOT NULL,
      project_ref TEXT,
      status TEXT CHECK(status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING',

      file_original_name TEXT,
      file_storage_name TEXT,
      file_mime_type TEXT,
      file_size INTEGER,
      file_url TEXT,

      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);
}

initContentTable().then(() => console.log("Content table ready")).catch(console.error);
