const express = require("express");
const router = express.Router();
const { requireUser, requireRole } = require("../services/authService");
const contentItemService = require("../services/contentItemService");
const governanceService = require("../services/governanceService");

router.use(requireUser);

// GET /api/governance/pending
router.get("/pending", requireRole("CHAMPION", "ADMIN"), async (req, res) => {
  try {
    const region = req.user.role === "ADMIN" ? undefined : req.user.region;
    const pending = await contentItemService.listContentItems({
      status: "PENDING",
      region,
    });
    res.json(pending);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch pending", error: e.message });
  }
});

// PATCH /api/governance/content-items/:id  { decision: APPROVED|REJECTED, feedback? }
router.patch("/content-items/:id", requireRole("CHAMPION", "ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { decision, feedback } = req.body;

    const updated = await governanceService.validateContent({
      id,
      decision,
      validatorUserId: req.user.id,
      feedback,
    });

    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: "Validation failed", error: e.message });
  }
});

module.exports = router;
