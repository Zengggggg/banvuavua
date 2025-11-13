import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "1234",
  database: process.env.DB_NAME || "frame_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 15000,
  dateStrings: true
};

if (process.env.DB_SSL === "true") {
  baseConfig.ssl = {}; // nếu nhà cung cấp yêu cầu SSL
}

export const pool = mysql.createPool(baseConfig);
