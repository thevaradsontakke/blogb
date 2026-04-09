import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/leadinfo',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Initialize database tables
export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Check if tables exist
    const tablesExist = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('leads', 'media')
    `);
    
    if (tablesExist.rows.length === 2) {
      console.log('✅ Database tables already exist');
      console.log('✅ Database ready for use');
      return;
    }
    
    // Create leads table with city and age fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100),
        age INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create media table for Cloudinary uploads
    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        media_type VARCHAR(50) NOT NULL,
        media_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration FLOAT,
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Database tables created successfully');
    
    // Try to create indexes (non-critical, won't fail if already exist)
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type)
      `);
      
      console.log('✅ Database indexes created successfully');
    } catch (indexErr) {
      console.log('⚠️  Indexes may already exist (this is OK)');
    }
  } catch (err) {
    // If error is about ownership, tables already exist - this is OK
    if (err.code === '42501') {
      console.log('✅ Database tables already exist (owned by another user)');
      console.log('✅ Database ready for use');
    } else {
      console.error('❌ Error initializing database:', err.message);
      throw err;
    }
  } finally {
    client.release();
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Closing database connection pool...');
  await pool.end();
  console.log('✅ Database connection pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Closing database connection pool...');
  await pool.end();
  console.log('✅ Database connection pool closed');
  process.exit(0);
});

export { pool };
