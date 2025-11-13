import express from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/frame-layout  -> list tất cả frame/layout
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT layout_key, frame_url, updated_at FROM frame_layouts ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("LIST layout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/frame-layout/:key -> lấy layout 1 frame
router.get("/:key", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM frame_layouts WHERE layout_key = ? LIMIT 1",
      [req.params.key]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Layout not found" });
    }
    const r = rows[0];
    res.json({
      layout_key: r.layout_key,
      frame_url: r.frame_url,
      textBox: { x: r.text_x, y: r.text_y, w: r.text_w, h: r.text_h },
      imageBox:{ x: r.image_x, y: r.image_y, w: r.image_w, h: r.image_h },

      textColor: r.text_color,
      imageBorderColor: r.image_border_color,
      textBoxColor: r.text_box_color,
      imageBoxColor: r.image_box_color,

      updated_by: r.updated_by,
      updated_at: r.updated_at,
    });

  } catch (err) {
    console.error("GET layout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/frame-layout -> tạo frame/layout mới (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { layout_key, frame_url, textBox, imageBox,
            textColor, imageBorderColor, textBoxColor, imageBoxColor } = req.body;

    if (!layout_key || !frame_url || !textBox || !imageBox) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await pool.query(
      `INSERT INTO frame_layouts
       (layout_key, frame_url,
        text_x, text_y, text_w, text_h,
        image_x, image_y, image_w, image_h,
        text_color, image_border_color, text_box_color, image_box_color,
        updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        layout_key,
        frame_url,
        textBox.x, textBox.y, textBox.w, textBox.h,
        imageBox.x, imageBox.y, imageBox.w, imageBox.h,
        textColor || "#333333",
        imageBorderColor || "#000000",
        textBoxColor || "#22c55e",
        imageBoxColor || "#38bdf8",
        "admin"
      ]
    );

    res.status(201).json({ message: "Created", layout_key });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "layout_key already exists" });
    }
    console.error("POST layout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// PATCH /api/frame-layout/:key -> update layout/frame_url (admin)
router.patch("/:key", requireAdmin, async (req, res) => {
  try {
    const { textBox, imageBox,
            frame_url,
            textColor, imageBorderColor, textBoxColor, imageBoxColor } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM frame_layouts WHERE layout_key = ? LIMIT 1",
      [req.params.key]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Layout not found" });
    }
    const c = rows[0];

    const newText = {
      x: textBox?.x ?? c.text_x,
      y: textBox?.y ?? c.text_y,
      w: textBox?.w ?? c.text_w,
      h: textBox?.h ?? c.text_h,
    };
    const newImage = {
      x: imageBox?.x ?? c.image_x,
      y: imageBox?.y ?? c.image_y,
      w: imageBox?.w ?? c.image_w,
      h: imageBox?.h ?? c.image_h,
    };

    const newFrameUrl        = frame_url        ?? c.frame_url;
    const newTextColor       = textColor       ?? c.text_color;
    const newImgBorderColor  = imageBorderColor?? c.image_border_color;
    const newTextBoxColor    = textBoxColor    ?? c.text_box_color;
    const newImageBoxColor   = imageBoxColor   ?? c.image_box_color;

    await pool.query(
      `UPDATE frame_layouts
       SET frame_url = ?,
           text_x = ?, text_y = ?, text_w = ?, text_h = ?,
           image_x = ?, image_y = ?, image_w = ?, image_h = ?,
           text_color = ?,
           image_border_color = ?,
           text_box_color = ?,
           image_box_color = ?,
           updated_by = ?
       WHERE layout_key = ?`,
      [
        newFrameUrl,
        newText.x, newText.y, newText.w, newText.h,
        newImage.x, newImage.y, newImage.w, newImage.h,
        newTextColor,
        newImgBorderColor,
        newTextBoxColor,
        newImageBoxColor,
        "admin",
        req.params.key,
      ]
    );

    res.json({
      message: "Updated",
      layout_key: req.params.key,
      frame_url: newFrameUrl,
      textBox: newText,
      imageBox: newImage,
      textColor: newTextColor,
      imageBorderColor: newImgBorderColor,
      textBoxColor: newTextBoxColor,
      imageBoxColor: newImageBoxColor,
    });
  } catch (err) {
    console.error("PATCH layout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
