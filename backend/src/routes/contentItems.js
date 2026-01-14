const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const { requireUser } = require("../services/authService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({ storage });

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID });
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

// POST /api/content-items (multipart/form-data)
router.post("/", requireUser, upload.single("file"), async (req, res) => {
  try {
    const { type, title, description, tags, projectRef } = req.body;

    if (!type || !title) {
      return res.status(400).json({ message: "type and title are required" });
    }

    // ✅ region auto from logged-in user
    const region = req.user.region;

    // tags can be optional, accept JSON or comma string
    let tagsArr = [];
    if (tags) {
      try {
        tagsArr = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch {
        tagsArr = String(tags).split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    const file = req.file; // may be undefined if no file uploaded
    const fileUrl = file ? `/uploads/${file.filename}` : null;

    const result = await runAsync(
      `INSERT INTO content_items
       (type, title, description, tags, region, project_ref, status,
        file_original_name, file_storage_name, file_mime_type, file_size, file_url,
        created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING',
        ?, ?, ?, ?, ?,
        ?)`,
      [
        type,
        title,
        description || "",
        JSON.stringify(tagsArr),
        region,
        projectRef || "",

        file?.originalname || null,
        file?.filename || null,
        file?.mimetype || null,
        file?.size || null,
        fileUrl,

        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Content created (pending)",
      id: result.id,
      fileUrl,
      region,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// LIST / SEARCH content items
router.get("/", requireUser, async (req, res) => {
  try {
    const { search, status, type, region } = req.query;

    let sql = `SELECT * FROM content_items WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND title LIKE ?`;
      params.push(`%${search}%`);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }
    if (region) {
      sql += ` AND region = ?`;
      params.push(region);
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = await allAsync(sql, params);
    rows.forEach(r => r.tags = JSON.parse(r.tags || "[]"));

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
