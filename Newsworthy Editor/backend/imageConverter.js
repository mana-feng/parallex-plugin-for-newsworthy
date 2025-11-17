/**
 * Image Converter Utility
 * 
 * Converts images to AVIF format using sharp library
 */

import sharp from 'sharp';

/**
 * Convert image data to AVIF format
 * @param {string} imageData - Image data URL (data:image/...;base64,...)
 * @param {Object} options - Conversion options
 * @param {number} options.quality - AVIF quality (1-100, default: 80)
 * @param {number} options.maxWidth - Maximum width (optional, maintains aspect ratio)
 * @param {number} options.maxHeight - Maximum height (optional, maintains aspect ratio)
 * @returns {Promise<string>} - AVIF data URL (data:image/avif;base64,...)
 */
export async function convertToAVIF(imageData, options = {}) {
  try {
    const { quality = 80, maxWidth, maxHeight } = options;
    
    // Extract base64 data from data URL
    const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid data URL format');
    }
    
    const base64Data = base64Match[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create sharp instance
    let sharpInstance = sharp(imageBuffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if needed (maintains aspect ratio)
    if (maxWidth || maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert to AVIF
    const avifBuffer = await sharpInstance
      .avif({
        quality: quality,
        effort: 4 // 0-9, higher = better compression but slower
      })
      .toBuffer();
    
    // Convert to base64
    const avifBase64 = avifBuffer.toString('base64');
    
    // Return as data URL
    return `data:image/avif;base64,${avifBase64}`;
  } catch (error) {
    console.error('AVIF conversion error:', error);
    // If conversion fails, return original image
    console.warn('AVIF conversion failed, using original image');
    return imageData;
  }
}

/**
 * Convert image buffer to AVIF format
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>} - AVIF buffer
 */
export async function convertBufferToAVIF(imageBuffer, options = {}) {
  try {
    const { quality = 80, maxWidth, maxHeight } = options;
    
    let sharpInstance = sharp(imageBuffer);
    
    // Resize if needed
    if (maxWidth || maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert to AVIF
    const avifBuffer = await sharpInstance
      .avif({
        quality: quality,
        effort: 4
      })
      .toBuffer();
    
    return avifBuffer;
  } catch (error) {
    console.error('AVIF conversion error:', error);
    throw error;
  }
}

