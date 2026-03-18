require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/project.routes");
const mailRoutes = require("./routes/mail.routes");

const app = express();

app.set("trust proxy", 1)

connectDB();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", mailRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "SMTP middleware running" });
});

app.use(express.static(path.join(__dirname, "../../frontend/dist")));
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist", "index.html"));
});

const PORT = process.env.PORT || 5015;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
