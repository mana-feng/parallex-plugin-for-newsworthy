/**
 * Unified Image Processing Service
 * 
 * This service provides a unified interface for all image upload operations:
 * 1. Convert to AVIF format (handled by backend)
 * 2. Save to local database
 * 3. Return localhost URL for access
 * 4. GitHub upload is handled separately via Storage Manager
 */

import * as dialog from '@/utils/dialog'
import { localhostToLocal } from '@/utils/imageUrlUtils'
import { saveTempImage } from '@/services/apiService'

/**
 * Unified image upload function
 * All image uploads (normal, fullwidth, float, parallax) use this function
 * 
 * @param {File} file - Image file to upload
 * @param {string} filename - Optional custom filename (defaults to file.name)
 * @returns {Promise<{success: boolean, localUrl?: string, error?: string}>}
 */
export async function uploadImage(file, filename = null) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    await dialog.warning('Please select an image file.\n\nOnly image files are supported.', {
      title: 'Invalid File Type',
      icon: '⚠️'
    })
    return { success: false, error: 'Invalid file type' }
  }

  try {
    const originalFileName = filename || file.name
    
    // Read file as data URL
    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        const dataUrl = e.target.result
        
        try {
          // Save to storage (localhost backend)
          // Backend will automatically convert to AVIF format
          const result = await saveTempImage(dataUrl, originalFileName)
          
          if (!result.ok) {
            const errorMsg = result.error || 'Failed to save image to storage'
            console.error('Save temp image failed:', errorMsg, result)
            throw new Error(errorMsg)
          }
          
          if (!result.data || !result.data.success) {
            const errorMsg = result.data?.error || 'Storage returned invalid response'
            console.error('Save temp image invalid response:', result.data)
            throw new Error(errorMsg)
          }
          
          // Convert URL to internal format for storage
          // localhost returns localhost URL, convert to local:// format
          const storageUrl = result.data.localUrl
          const internalUrl = localhostToLocal(storageUrl)
          
          resolve({ 
            success: true, 
            localUrl: internalUrl,
            localhostUrl: storageUrl,
            imageId: result.data.imageId
          })
        } catch (saveError) {
          console.error('Storage save failed:', saveError)
          const errorMessage = saveError.message || 'Unknown error occurred'
          
          const errorDetail = `Please ensure:\n1. Backend server is running (localhost:3001)\n2. Database is accessible\n\nPlease fix the issue and try again.`
          
          await dialog.error(
            `Failed to save image to storage.\n\nError: ${errorMessage}\n\n${errorDetail}`,
            {
              title: 'Save Error'
            }
          )
          
          reject(saveError)
        }
      }
      
      reader.onerror = async () => {
        await dialog.error('Failed to read image file. Please try another file.', {
          title: 'Read Error'
        })
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  } catch (error) {
    console.error('Image processing error:', error)
    await dialog.error('Failed to process image. An error occurred while processing the image.', {
      title: 'Processing Error'
    })
    return { success: false, error: error.message }
  }
}

/**
 * Upload image from data URL (for re-uploading invalid images)
 * @param {string} dataUrl - Image data URL
 * @param {string} filename - Filename for the image
 * @returns {Promise<{success: boolean, localUrl?: string, error?: string}>}
 */
export async function uploadImageFromDataUrl(dataUrl, filename) {
  try {
    const result = await saveTempImage(dataUrl, filename)
    
    if (!result.ok) {
      return { success: false, error: result.error || 'Failed to save image' }
    }
    
    if (!result.data || !result.data.success) {
      return { success: false, error: result.data?.error || 'Invalid response' }
    }
    
    const storageUrl = result.data.localUrl
    const internalUrl = localhostToLocal(storageUrl)
    
    return {
      success: true,
      localUrl: internalUrl,
      localhostUrl: storageUrl,
      imageId: result.data.imageId
    }
  } catch (error) {
    console.error('Upload from data URL failed:', error)
    return { success: false, error: error.message }
  }
}

