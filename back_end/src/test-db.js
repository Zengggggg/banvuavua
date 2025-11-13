import { pool } from "./db.js";

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    console.log("✅ Database connected successfully:", rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

testConnection();
