import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Production-safe PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
});

// Initialize database
export const initDatabase = async () => {
  try {
    const client = await pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          city VARCHAR(100),
          age INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS media (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          description TEXT,
          media_type VARCHAR(50),
          media_url TEXT,
          thumbnail_url TEXT,
          duration FLOAT,
          file_size BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("✅ Database initialized");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Closing DB");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Closing DB");
  await pool.end();
  process.exit(0);
});

export { pool };
