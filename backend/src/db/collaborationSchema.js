const db = require("./sqlite");

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

async function initCollaborationTables() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT CHECK(role IN ('OWNER','MEMBER')) NOT NULL DEFAULT 'MEMBER',
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (workspace_id, user_id),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS workspace_content (
      workspace_id INTEGER NOT NULL,
      content_id INTEGER NOT NULL,
      shared_by INTEGER NOT NULL,
      note TEXT,
      shared_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (workspace_id, content_id),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(content_id) REFERENCES content_items(id),
      FOREIGN KEY(shared_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS workspace_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  console.log("Collaboration tables ready");
}

initCollaborationTables().catch(console.error);
