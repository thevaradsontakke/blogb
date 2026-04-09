# PostgreSQL Database Setup Guide

## Prerequisites

1. Install PostgreSQL on your system:
   - **Windows**: Download from https://www.postgresql.org/download/windows/
   - **Mac**: `brew install postgresql`
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib`

## Local Development Setup

### 1. Start PostgreSQL Service

**Windows:**
```bash
# PostgreSQL should start automatically after installation
# Or use Services app to start it manually
```

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo service postgresql start
```

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE leadinfo;

# Create user (optional, for better security)
CREATE USER leadinfo_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE leadinfo TO leadinfo_user;

# Exit
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/leadinfo
```

Or if you created a custom user:
```
DATABASE_URL=postgresql://leadinfo_user:your_secure_password@localhost:5432/leadinfo
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

The database tables will be created automatically when you start the server:

```bash
npm run dev
```

## Production Deployment

### Option 1: Heroku

1. Create a Heroku app
2. Add Heroku Postgres addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
3. The `DATABASE_URL` will be set automatically
4. Deploy your code

### Option 2: Railway

1. Create a new project on Railway
2. Add PostgreSQL database
3. Copy the `DATABASE_URL` from Railway dashboard
4. Set it as environment variable
5. Deploy your code

### Option 3: Render

1. Create a new PostgreSQL database on Render
2. Copy the External Database URL
3. Set it as `DATABASE_URL` environment variable
4. Deploy your web service

### Option 4: Supabase

1. Create a new project on Supabase
2. Go to Settings > Database
3. Copy the Connection String (URI format)
4. Set it as `DATABASE_URL` environment variable

## Database Schema

The application will automatically create the following table:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  age INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_email ON leads(email);
```

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Mac/Linux
   pg_isready
   
   # Windows
   pg_ctl status
   ```

2. **Verify connection string:**
   - Format: `postgresql://username:password@host:port/database`
   - Ensure no spaces or special characters in password
   - Use URL encoding for special characters if needed

3. **Check firewall settings:**
   - PostgreSQL default port is 5432
   - Ensure it's not blocked by firewall

### Migration from SQLite

If you have existing data in SQLite, you can export and import:

1. **Export from SQLite:**
   ```bash
   sqlite3 database.sqlite .dump > data.sql
   ```

2. **Convert and import to PostgreSQL:**
   - Manually adjust SQL syntax differences
   - Or use a migration tool like `pgloader`

## Useful PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d leadinfo

# List all databases
\l

# List all tables
\dt

# Describe table structure
\d leads

# View all leads
SELECT * FROM leads;

# Count leads
SELECT COUNT(*) FROM leads;

# Exit
\q
```

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for database users
3. **Limit database user permissions** in production
4. **Enable SSL** for production database connections
5. **Regular backups** - Set up automated backups
6. **Monitor connections** - Use connection pooling (already configured)

## Support

For issues or questions:
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js pg library: https://node-postgres.com/
