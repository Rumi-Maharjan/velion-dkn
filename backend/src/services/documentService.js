const db = require("../db/sqlite");

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
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

async function listDocuments() {
  return all(`SELECT * FROM documents ORDER BY id DESC`);
}

async function createDocument({ title, tags, author, region }) {
    const tagsStr = Array.isArray(tags) ? tags.join(",") : (tags || "");
    const result = await run(
        `INSERT INTO documents (title, tags, author, region) VALUES (?, ?, ?, ?)`,
        [title, tagsStr, author || "", region || ""]
    );
    const rows = await all(`SELECT * FROM documents WHERE id = ?`, [result.id]);
    return rows[0];
}

async function setStatus(id, status) {
    await run(`UPDATE documents SET status = ? WHERE id = ?`, [status, id]);
    const rows = await all(`SELECT * FROM documents WHERE id = ?`, [id]);
    return rows[0];
}

module.exports = { listDocuments, createDocument, setStatus };
