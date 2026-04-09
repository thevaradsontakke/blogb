import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/database.js';
import contactRoutes from './routes/contact.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Added size limit for security
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Added for form data

// Static files (React build)
app.use(express.static(join(__dirname, '../client/dist')));

// Database setup with error handling
initDatabase().catch(error => {
  // Only exit if it's a critical error (not ownership issues)
  if (error.code !== '42501') {
    console.error('❌ Critical database initialization failed:', error);
    process.exit(1);
  }
  console.log('⚠️  Database initialization had warnings but server can continue');
});

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);

// Health check with more detailed info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: '✅ Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch-all → Serve React frontend (should be after API 404 handler)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

// Start server with error handling
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});