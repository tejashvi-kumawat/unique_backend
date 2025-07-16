import { getDatabase } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

export const getAllPhotos = async (req, res) => {
  try {
    const db = getDatabase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const photos = await db.all(
      'SELECT * FROM photos ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const totalCount = await db.get('SELECT COUNT(*) as count FROM photos');
    
    res.json({ 
      photos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount.count / limit),
        totalPhotos: totalCount.count,
        hasNext: offset + photos.length < totalCount.count
      }
    });
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    const { filename, base64Data, caption } = req.body;
    
    if (!filename || !base64Data) {
      return res.status(400).json({ 
        error: 'Filename and base64Data are required' 
      });
    }
    
    // Validate base64 data
    if (!base64Data.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Invalid image format' 
      });
    }
    
    const db = getDatabase();
    const photoId = uuidv4();
    
    await db.run(
      'INSERT INTO photos (id, filename, base64_data, caption) VALUES (?, ?, ?, ?)',
      [photoId, filename, base64Data, caption || '']
    );
    
    res.json({ 
      success: true, 
      message: 'Photo uploaded successfully',
      photoId 
    });
  } catch (error) {
    console.error('Failed to upload photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Photo ID is required' });
    }
    
    const db = getDatabase();
    
    // Check if photo exists
    const photo = await db.get('SELECT id FROM photos WHERE id = ?', [id]);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    await db.run('DELETE FROM photos WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

export const getPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const photo = await db.get('SELECT * FROM photos WHERE id = ?', [id]);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ photo });
  } catch (error) {
    console.error('Failed to get photo:', error);
    res.status(500).json({ error: 'Failed to get photo' });
  }
};

export const updatePhotoCaption = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Photo ID is required' });
    }
    
    const db = getDatabase();
    
    // Check if photo exists
    const photo = await db.get('SELECT id FROM photos WHERE id = ?', [id]);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    await db.run(
      'UPDATE photos SET caption = ? WHERE id = ?',
      [caption || '', id]
    );
    
    res.json({ 
      success: true, 
      message: 'Photo caption updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update photo caption:', error);
    res.status(500).json({ error: 'Failed to update photo caption' });
  }
};
