// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import frameLayoutRoutes from "./routes/frameLayoutRoutes.js";
import templatesRoutes from "./routes/templatesRoutes.js";

dotenv.config();

const app = express();

// --- Resolve __dirname (ESM) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === DEFINE publicDir TRƯỚC KHI DÙNG ===
const publicDir = path.join(__dirname, "..", "public");
// Log để kiểm tra trên Render
console.log("[boot] publicDir:", publicDir);

app.use(cors());
app.use(express.json());

// Serve static, dùng template-select.html làm index khi vào "/"
app.use(express.static(publicDir, { index: "template-select.html" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// (Tuỳ chọn) Route "/" gửi file cụ thể (an toàn nếu bạn muốn cứng)
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "template-select.html"));
});

// API routes
app.use("/api/frame-layout", frameLayoutRoutes);
app.use("/api/templates", templatesRoutes);

// Fallback cho API không tồn tại
app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Static files from: ${publicDir}`);
});
