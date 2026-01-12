const express = require("express");
const cors = require("cors");

require("./db/sqlite"); // ensure DB init runs

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint (deployment evidence)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "velion-dkn-backend" });
});

// Auth (demo)
app.use("/api", require("./routes/auth"));

// Type Model-based interfaces
app.use("/api/content-items", require("./routes/contentItems"));
app.use("/api/governance", require("./routes/governance"));
app.use("/api/recommendations", require("./routes/recommendations"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
