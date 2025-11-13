// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import frameLayoutRoutes from "./routes/frameLayoutRoutes.js";
import templatesRoutes from "./routes/templatesRoutes.js"; // 👈 THÊM

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// static
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "template-select.html"));
});
// API
app.use("/api/frame-layout", frameLayoutRoutes);
app.use("/api/templates", templatesRoutes); // 👈 THÊM

// fallback API
app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, "..", "public")}`);
});
