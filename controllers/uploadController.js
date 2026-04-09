import cloudinary from '../config/cloudinary.js';
import { pool } from '../config/database.js';
import fs from 'fs';

/**
 * Upload Image to Cloudinary
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description } = req.body;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'varadbuilds/images',
      transformation: [
        { width: 1200, height: 630, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    // Save to database
    const query = `
      INSERT INTO media (title, description, media_type, media_url, thumbnail_url, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const values = [
      title || 'Untitled',
      description || '',
      'image',
      result.secure_url,
      result.secure_url,
      result.bytes
    ];

    const dbResult = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      mediaId: dbResult.rows[0].id,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Clean up local file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

/**
 * Upload Video to Cloudinary
 */
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description } = req.body;

    console.log('📤 Uploading video to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'varadbuilds/videos',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      eager: [
        { width: 300, height: 300, crop: 'pad', audio_codec: 'none' },
        { width: 160, height: 100, crop: 'crop', gravity: 'south', audio_codec: 'none' }
      ],
      eager_async: true
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    console.log('✅ Video uploaded to Cloudinary');

    // Save to database
    const query = `
      INSERT INTO media (title, description, media_type, media_url, thumbnail_url, duration, file_size)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      title || 'Untitled Video',
      description || '',
      'video',
      result.secure_url,
      result.eager?.[0]?.secure_url || result.secure_url,
      result.duration || 0,
      result.bytes
    ];

    const dbResult = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      mediaId: dbResult.rows[0].id,
      url: result.secure_url,
      thumbnail: result.eager?.[0]?.secure_url,
      duration: result.duration,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    
    // Clean up local file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message
    });
  }
};

/**
 * Get All Media
 */
export const getAllMedia = async (req, res) => {
  try {
    const { type } = req.query; // 'image' or 'video'
    
    let query = 'SELECT * FROM media';
    const values = [];
    
    if (type) {
      query += ' WHERE media_type = $1';
      values.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rows.length,
      media: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media'
    });
  }
};

/**
 * Delete Media
 */
export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    // Get media info from database
    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1',
      [id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    const media = mediaResult.rows[0];

    // Extract public_id from URL
    const urlParts = media.media_url.split('/');
    const publicIdWithExt = urlParts.slice(-2).join('/');
    const publicId = publicIdWithExt.split('.')[0];

    // Delete from Cloudinary
    const resourceType = media.media_type === 'video' ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    // Delete from database
    await pool.query('DELETE FROM media WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting media:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting media',
      error: error.message
    });
  }
};
