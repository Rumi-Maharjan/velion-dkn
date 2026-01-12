const express = require("express");
const router = express.Router();
const documentService = require("../services/documentService");

// GET /api/documents
router.get("/", async (req, res) => {
    try {
        const docs = await documentService.listDocuments();
        res.json(docs);
    } catch (e) {
        res.status(500).json({ message: "Failed to list documents", error: e.message });
    }
});

// POST /api/documents
router.post("/", async (req, res) => {
    try {
        const { title, tags, author, region } = req.body;
        if (!title) return res.status(400).json({ message: "title is required" });

        const created = await documentService.createDocument({ title, tags, author, region });
        res.status(201).json(created);
    } catch (e) {
        res.status(500).json({ message: "Failed to create document", error: e.message });
    }
});

module.exports = router;