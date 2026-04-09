import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('leads', 'media')
      ORDER BY table_name
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Tables exist:', result.rows.map(r => r.table_name).join(', '));
      
      // Count leads
      const countResult = await client.query('SELECT COUNT(*) as count FROM leads');
      console.log(`📊 Total leads in database: ${countResult.rows[0].count}`);
    } else {
      console.log('⚠️  No tables found. Run the setup script to create tables.');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ All checks passed! Database is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    
    if (err.code === '28P01') {
      console.log('\n💡 Solution: Check your database password in .env file');
      console.log('   Or run this in pgAdmin:');
      console.log('   ALTER USER leadinfo WITH PASSWORD \'Varad210\';');
    } else if (err.code === '3D000') {
      console.log('\n💡 Solution: Database does not exist. Create it in pgAdmin:');
      console.log('   CREATE DATABASE leadinfo OWNER leadinfo;');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: PostgreSQL is not running. Start it:');
      console.log('   Windows: Check Services for postgresql service');
      console.log('   Mac: brew services start postgresql');
      console.log('   Linux: sudo systemctl start postgresql');
    }
    
    process.exit(1);
  }
}

testConnection();
