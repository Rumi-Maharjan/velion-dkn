const express = require("express");
const router = express.Router();
const { requireUser } = require("../services/authService");
const recommendationService = require("../services/recommendationService");

router.use(requireUser);

// GET /api/recommendations
router.get("/", async (req, res) => {
  try {
    const recs = await recommendationService.recommendForUser(req.user, { limit: 5 });
    res.json(recs);
  } catch (e) {
    res.status(500).json({ message: "Failed to recommend", error: e.message });
  }
});

module.exports = router;
