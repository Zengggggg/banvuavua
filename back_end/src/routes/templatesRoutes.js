import express from "express";
import { pool } from "../db.js";

const router = express.Router();

/**
 * GET /api/templates
 * -> Trả danh sách templates (không kèm frames)
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, template_key, name, description, preview_url
       FROM templates
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/templates error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * GET /api/templates/:templateKey
 * -> Trả info 1 template + list các frame thuộc template đó
 * LƯU Ý: chỉ lấy layout_key + frame_url, không đụng tới text_box_x...
 * Tool frame-text-tool sẽ gọi /api/frame-layout/:layoutKey riêng để lấy layout chi tiết.
 */
router.get("/:templateKey", async (req, res) => {
  try {
    const { templateKey } = req.params;

    // 1. Lấy template theo template_key
    const [tplRows] = await pool.execute(
      `SELECT id, template_key, name, description, preview_url
       FROM templates
       WHERE template_key = ?
       LIMIT 1`,
      [templateKey]
    );

    if (!tplRows.length) {
      return res.status(404).json({ message: "Template not found" });
    }

    const template = tplRows[0];

    // 2. Lấy các frame thuộc template này
    // CHỈ SELECT NHỮNG CỘT CHẮC CHẮN TỒN TẠI: layout_key, frame_url, ...
    const [frameRows] = await pool.execute(
      `SELECT
          layout_key,
          frame_url
       FROM frame_layouts
       WHERE template_id = ?
       ORDER BY id ASC`,
      [template.id]
    );

    const frames = frameRows.map((f) => ({
      layout_key: f.layout_key,
      frame_url: f.frame_url,
    }));

    res.json({
      id: template.id,
      template_key: template.template_key,
      name: template.name,
      description: template.description,
      preview_url: template.preview_url,
      frames,
    });
  } catch (err) {
    console.error("GET /api/templates/:templateKey error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
