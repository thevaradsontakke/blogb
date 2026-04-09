import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { initDatabase } from "./config/database.js";
import contactRoutes from "./routes/contact.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(join(__dirname, "../client/dist")));

// Database Init (Don't crash server)
initDatabase().catch((err) => {
  console.error("Database init error:", err);
});

// Routes
app.use("/api/contact", contactRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "running",
    time: new Date(),
  });
});

// React catch all
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../client/dist/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
