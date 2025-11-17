/**
 * Image Block API
 * 
 * This module handles all image-related API endpoints including:
 * - Saving temporary images to local database
 * - Retrieving temporary images
 * - Uploading images to GitHub
 * - Batch upload operations
 * - Conflict resolution
 */

import crypto from 'crypto'
import { tempImageOperations } from './database.js'
import { uploadImageToGitHub, checkImageExists } from './github.js'
import { convertToAVIF } from './imageConverter.js'

/**
 * Setup image block API routes
 * @param {Express} app - Express app instance
 * @param {number} PORT - Server port number
 */
export function setupImageBlockAPI(app, PORT) {
  // Save image to local database (for preview before publishing)
  // Automatically converts to AVIF format
  app.post('/api/images/temp/save', async (req, res) => {
    try {
      const { imageData, filename, imageId: providedImageId } = req.body;
      
      if (!imageData || !filename) {
        return res.status(400).json({ error: 'Image data and filename are required' });
      }

      // Use provided imageId if available, otherwise generate a new one
      const imageId = providedImageId && typeof providedImageId === 'string' && providedImageId.length > 0
        ? providedImageId
        : crypto.randomUUID();
      
      // Convert original filename to AVIF extension
      const originalFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      const avifFilename = `${originalFilename}.avif`;
      
      // Convert image to AVIF format
      let avifImageData;
      try {
        avifImageData = await convertToAVIF(imageData, {
          quality: 80,
          maxWidth: 4096, // Max width for web images
          maxHeight: 4096 // Max height for web images
        });
        console.log(`Converted image to AVIF: ${filename} to ${avifFilename}`);
      } catch (conversionError) {
        console.warn('AVIF conversion failed, using original image:', conversionError.message);
        // If conversion fails, use original image
        avifImageData = imageData;
      }
      
      // Save AVIF image to database
      tempImageOperations.save.run({
        image_id: imageId,
        filename: avifFilename,
        image_data: avifImageData,
        mime_type: 'image/avif'
      });
      
      console.log(`Saved temp image (AVIF): ${imageId} (${avifFilename})`);
      
      // Return HTTP URL that frontend can use to display the image
      res.json({
        success: true,
        imageId: imageId,
        localUrl: `http://localhost:${PORT}/api/images/temp/${imageId}`,
        filename: avifFilename,
        originalFilename: filename
      });
    } catch (error) {
      console.error('Failed to save temp image:', error);
      res.status(500).json({ 
        error: 'Failed to save image to local database',
        details: error.message 
      });
    }
  });

  // Get image from local database (returns actual image data for <img> tags)
  app.get('/api/images/temp/:imageId', async (req, res) => {
    try {
      const { imageId } = req.params;
      
      const image = tempImageOperations.getById.get(imageId);
      
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Extract base64 data from data URL
      const base64Data = image.image_data.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers
      // Always set Content-Type to image/avif since we store as AVIF
      res.setHeader('Content-Type', 'image/avif');
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Send the image buffer
      res.send(imageBuffer);
    } catch (error) {
      console.error('Failed to get temp image:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve image',
        details: error.message 
      });
    }
  });

  // Get all temp images
  app.get('/api/images/temp', async (req, res) => {
    try {
      const images = tempImageOperations.getAll.all();
      
      res.json({
        success: true,
        count: images.length,
        images: images.map(img => ({
          imageId: img.image_id,
          filename: img.filename,
          mimeType: img.mime_type,
          createdAt: img.created_at,
          size: Math.round(img.image_data.length / 1024) // KB
        }))
      });
    } catch (error) {
      console.error('Failed to get temp images:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve images',
        details: error.message 
      });
    }
  });

  // Check if image exists in GitHub before upload
  app.post('/api/images/check-conflict', async (req, res) => {
    try {
      const { filename, customDate } = req.body;
      
      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const result = await checkImageExists(filename, customDate ? new Date(customDate) : null);
      
      res.json({
        exists: result.exists,
        sha: result.sha,
        path: result.path,
        sanitizedFilename: result.sanitizedFilename
      });
    } catch (error) {
      console.error('Check image conflict error:', error);
      res.status(500).json({ 
        error: 'Failed to check image conflict',
        details: error.message 
      });
    }
  });

  // Upload image to GitHub with conflict handling
  app.post('/api/images/upload-to-github', async (req, res) => {
    try {
      const { imageData, filename, overwrite, existingSha } = req.body;
      
      if (!imageData || !filename) {
        return res.status(400).json({ error: 'Image data and filename are required' });
      }

      const uploadResult = await uploadImageToGitHub(
        imageData,
        filename,
        null, // customDate
        overwrite || false,
        existingSha || null
      );

      if (uploadResult.conflict) {
        // Return conflict information to frontend
        return res.status(409).json({
          conflict: true,
          exists: true,
          sha: uploadResult.sha,
          path: uploadResult.path,
          sanitizedFilename: uploadResult.sanitizedFilename,
          message: uploadResult.message
        });
      }

      if (uploadResult.success) {
        res.json({
          success: true,
          url: uploadResult.url,
          relativePath: uploadResult.relativePath,
          filename: uploadResult.filename
        });
      } else {
        res.status(500).json({
          success: false,
          error: uploadResult.message || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload image to GitHub',
        details: error.message 
      });
    }
  });

  // Validate image IDs before upload (check which ones exist in database)
  app.post('/api/images/temp/validate', async (req, res) => {
    try {
      const { imageIds } = req.body;
      
      if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'imageIds array is required' });
      }

      const validation = {
        valid: [],
        invalid: []
      };

      for (const imageId of imageIds) {
        const image = tempImageOperations.getById.get(imageId);
        
        if (image) {
          validation.valid.push({
            imageId,
            filename: image.filename,
            createdAt: image.created_at
          });
        } else {
          validation.invalid.push({
            imageId,
            reason: 'Image not found in database. It may have been automatically cleaned up (older than 24 hours), or the server was restarted and temp images were cleared.'
          });
        }
      }

      res.json({
        success: true,
        total: imageIds.length,
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        validation
      });
    } catch (error) {
      console.error('Image validation error:', error);
      res.status(500).json({ 
        error: 'Failed to validate images',
        details: error.message 
      });
    }
  });

  // Batch upload temp images to GitHub
  app.post('/api/images/temp/upload-to-github', async (req, res) => {
    try {
      const { imageIds, conflictResolutions } = req.body;
      
      console.log(`Backend: Received request to upload ${imageIds?.length || 0} image(s) to GitHub`);
      
      if (!imageIds || !Array.isArray(imageIds)) {
        console.error('Backend: imageIds array is required but not provided');
        return res.status(400).json({ error: 'imageIds array is required' });
      }

      if (imageIds.length === 0) {
        console.warn('Backend: No image IDs provided - nothing to upload');
        return res.json({
          success: true,
          uploaded: 0,
          failed: 0,
          conflicts: 0,
          results: { success: [], failed: [], conflicts: [] }
        });
      }

      console.log(`Backend: Processing ${imageIds.length} image ID(s):`, imageIds.map(id => id.substring(0, 8) + '...'));

      const results = {
        success: [],
        failed: [],
        conflicts: []
      };

      for (const imageId of imageIds) {
        try {
          console.log(`Backend: Looking up image ${imageId.substring(0, 8)} in database`);
          // Get image from database
          const image = tempImageOperations.getById.get(imageId);
          
          if (!image) {
            // Image not found - may have been cleaned up or already uploaded
            // Check if this might be a stale reference (image was deleted but URL still in editor)
            console.error(`Backend: Image ${imageId.substring(0, 8)} not found in database`);
            results.failed.push({
              imageId,
              error: 'Image not found in database. It may have been automatically cleaned up, or the URL may have already been replaced with a GitHub URL. Please re-upload the image if it still appears in the editor.'
            });
            console.warn(`Image ${imageId} not found in database - may have been cleaned up or is a stale reference`);
            continue;
          }

          console.log(`✅ Backend: Found image ${imageId.substring(0, 8)}... in database, filename: ${image.filename}`);

          // Check if there's a conflict resolution for this image
          const resolution = conflictResolutions?.[imageId];
          const overwrite = resolution?.action === 'overwrite';
          const newFilename = resolution?.action === 'rename' ? resolution.newFilename : image.filename;
          const existingSha = resolution?.sha;

          // Upload to GitHub
          console.log(`📤 Backend: Uploading image ${imageId.substring(0, 8)}... to GitHub (filename: ${newFilename})...`);
          const uploadResult = await uploadImageToGitHub(
            image.image_data,
            newFilename,
            null, // customDate
            overwrite,
            existingSha
          );

          if (uploadResult.conflict) {
            console.log(`⚠️ Backend: Image ${imageId.substring(0, 8)}... has conflict (file already exists)`);
            // File exists, need user decision
            results.conflicts.push({
              imageId,
              filename: image.filename,
              sanitizedFilename: uploadResult.sanitizedFilename,
              sha: uploadResult.sha,
              path: uploadResult.path,
              message: uploadResult.message
            });
          } else if (uploadResult.success) {
            console.log(`✅ Backend: Successfully uploaded image ${imageId.substring(0, 8)}... to ${uploadResult.url}`);
            results.success.push({
              imageId,
              localUrl: `local://${imageId}`,
              githubUrl: uploadResult.url,
              filename: uploadResult.filename
            });

            // [TEMP_IMAGE_CLEANUP #4] Delete from temp storage after successful batch upload to GitHub
            tempImageOperations.delete.run(imageId);
            console.log(`🧹 Backend: Deleted temp image ${imageId.substring(0, 8)}... from database`);
          } else {
            console.error(`❌ Backend: Upload failed for image ${imageId.substring(0, 8)}...: ${uploadResult.message || 'Unknown error'}`);
            results.failed.push({
              imageId,
              error: uploadResult.message || 'Upload failed'
            });
          }
        } catch (error) {
          console.error(`❌ Backend: Exception uploading image ${imageId.substring(0, 8)}...:`, error);
          results.failed.push({
            imageId,
            error: error.message
          });
        }
      }

      console.log(`📊 Backend: Batch upload complete - ${results.success.length} success, ${results.failed.length} failed, ${results.conflicts.length} conflicts`);

      res.json({
        success: results.conflicts.length === 0,
        uploaded: results.success.length,
        failed: results.failed.length,
        conflicts: results.conflicts.length,
        results: results
      });
    } catch (error) {
      console.error('Batch upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload images to GitHub',
        details: error.message 
      });
    }
  });
}

