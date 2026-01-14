const express = require("express");
const cors = require("cors");
const path = require("path");

const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "db/database.sqlite");
const UPLOAD_PATH =
  process.env.UPLOAD_PATH || path.join(__dirname, "../uploads");


require("./db/sqlite"); // ensure DB init runs
require("./db/contentSchema");
require("./db/collaborationSchema");

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
app.use("/api/admin", require("./routes/adminUsers"));
app.use("/api/content-items", require("./routes/contentItems"));
app.use("/uploads", express.static(UPLOAD_PATH));
app.use("/api/governance", require("./routes/governance"));
app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/collaboration", require("./routes/collaboration"));
app.use("/api/users", require("./routes/userSearch"));
app.use("/api/content-items", require("./routes/contentSearch"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);
