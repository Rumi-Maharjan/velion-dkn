const contentItemService = require("./contentItemService");

// Heuristic: prefer APPROVED, same region, tag overlap
function scoreItem(user, item) {
  let score = 0;
  if (item.status === "APPROVED") score += 2;
  if (user.region && item.region === user.region) score += 2;

  // Tag overlap
  const userTags = []; // later you can store user interests; keep simple now
  const overlap = item.tags.filter((t) => userTags.includes(t)).length;
  score += overlap;

  // Tiny recency boost (newer first already, but we add small bump)
  score += 0.1;
  return score;
}

async function recommendForUser(user, { limit = 5 } = {}) {
  const items = await contentItemService.listContentItems({
    status: "APPROVED",
    region: user.region === "GLOBAL" ? undefined : user.region,
  });

  // If user is GLOBAL, show most recent approved from all regions
  const scored = items.map((i) => ({ item: i, score: scoreItem(user, i) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.item);
}

module.exports = { recommendForUser };
