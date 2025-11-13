import dotenv from "dotenv";
dotenv.config();

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export function requireAdmin(req, res, next) {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  // có thể gán thông tin giả định
  req.adminId = "admin"; 
  next();
}
