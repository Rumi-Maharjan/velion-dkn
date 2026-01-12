const express = require("express");
const router = express.Router();
const { requireUser } = require("../services/authService");
const contentItemService = require("../services/contentItemService");

// All endpoints require a user (matches CW1 actors)
router.use(requireUser);

// GET /api/content-items?search=&type=&region=&status=
router.get("/", async (req, res) => {
  try {
    const items = await contentItemService.listContentItems({
      search: req.query.search,
      type: req.query.type,
      region: req.query.region,
      status: req.query.status,
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to list items", error: e.message });
  }
});

// GET /api/content-items/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await contentItemService.getContentItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Failed to get item", error: e.message });
  }
});

// POST /api/content-items
router.post("/", async (req, res) => {
  try {
    const { type = "DOCUMENT", title, description, tags, author, region, projectRef } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });
    if (!["DOCUMENT", "TEMPLATE"].includes(type)) {
      return res.status(400).json({ message: "type must be DOCUMENT or TEMPLATE" });
    }

    const created = await contentItemService.createContentItem({
      type,
      title,
      description,
      tags,
      author,
      region,
      projectRef,
      uploadedBy: req.user.id,
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: "Failed to create item", error: e.message });
  }
});

module.exports = router;
