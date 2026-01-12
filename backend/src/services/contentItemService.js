const db = require("../db/sqlite");

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

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function normalizeRow(row) {
  if (!row) return row;
  return {
    ...row,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    projectRef: row.project_ref || "",
    uploadedBy: row.uploaded_by ?? null,
    validatedBy: row.validated_by ?? null,
    validationFeedback: row.validation_feedback || "",
    createdAt: row.created_at,
    validatedAt: row.validated_at,
  };
}

async function createContentItem({ type, title, description, tags, author, region, projectRef, uploadedBy }) {
  const tagsStr = Array.isArray(tags) ? tags.join(",") : (tags || "");
  const result = await run(
    `INSERT INTO documents (type, title, description, tags, author, region, project_ref, uploaded_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [type, title, description || "", tagsStr, author || "", region || "", projectRef || "", uploadedBy]
  );
  const row = await get(`SELECT * FROM documents WHERE id = ?`, [result.id]);
  return normalizeRow(row);
}

async function listContentItems({ search, type, region, status }) {
  let sql = `SELECT * FROM documents WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (type) {
    sql += ` AND type = ?`;
    params.push(type);
  }
  if (region) {
    sql += ` AND region = ?`;
    params.push(region);
  }
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC`;
  const rows = await all(sql, params);
  return rows.map(normalizeRow);
}

async function getContentItemById(id) {
  const row = await get(`SELECT * FROM documents WHERE id = ?`, [id]);
  return normalizeRow(row);
}

async function setValidation({ id, decision, validatedBy, feedback }) {
  const status = decision; // APPROVED | REJECTED
  await run(
    `UPDATE documents
     SET status = ?, validated_by = ?, validation_feedback = ?, validated_at = datetime('now')
     WHERE id = ?`,
    [status, validatedBy, feedback || "", id]
  );
  return getContentItemById(id);
}

module.exports = {
  createContentItem,
  listContentItems,
  getContentItemById,
  setValidation,
};
