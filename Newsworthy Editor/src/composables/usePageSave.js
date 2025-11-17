/**
 * Page save/update operations
 */

import { useEditorStore } from '@/stores/editorStore'
import * as dialog from '@/utils/dialog'
import { extractImageId, localToLocalhost } from '@/utils/imageUrlUtils'
import { getValidateImageIdsFunction } from '@/config/imageStorage'
import {
  uploadImagesToGitHub
} from '@/services/apiService'
import { uploadImageFromDataUrl } from '@/services/imageProcessingService'

export function usePageSave() {
  const store = useEditorStore()

  /**
   * Re-upload image from URL
   */
  async function reuploadImageFromUrl(imageUrl, imageId) {
    try {
      const normalizedUrl = imageUrl?.trim()
      
      if (!normalizedUrl) {
        return {
          success: false,
          error: 'Image URL is empty'
        }
      }
      
      let imageData = null
      
      if (normalizedUrl.startsWith('data:image/')) {
        imageData = normalizedUrl
      } 
      else if (normalizedUrl.startsWith('local://')) {
        try {
          const localhostUrl = localToLocalhost(normalizedUrl)
          
          const response = await fetch(localhostUrl)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          const blob = await response.blob()
          
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch (fetchError) {
          console.error(`Failed to fetch image from local URL ${normalizedUrl}:`, fetchError)
          return {
            success: false,
            error: `Failed to fetch image from local server: ${fetchError.message}`
          }
        }
      }
      else if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
        try {
          const response = await fetch(normalizedUrl)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          const blob = await response.blob()
          
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch (fetchError) {
          console.error(`Failed to fetch image from URL ${normalizedUrl}:`, fetchError)
          return {
            success: false,
            error: `Failed to fetch image data: ${fetchError.message}`
          }
        }
      }
      else {
        console.error(`Unsupported URL format: ${normalizedUrl}`)
        return {
          success: false,
          error: `Unsupported image URL format: ${normalizedUrl.substring(0, 50)}...`
        }
      }
      
      const filename = imageId ? `image-${imageId.substring(0, 8)}.avif` : `image-${Date.now()}.avif`
      
      // Use unified image upload service (converts to AVIF, saves to local database)
      const result = await uploadImageFromDataUrl(imageData, filename)
      
      if (!result.success) {
        const errorMsg = result.error || 'Upload failed'
        console.error(`Failed to re-upload image ${imageId?.substring(0, 8)}:`, errorMsg)
        return {
          success: false,
          error: errorMsg
        }
      }
      
      return {
        success: true,
        imageId: result.imageId,
        localUrl: result.localUrl
      }
    } catch (error) {
      console.error(`Error re-uploading image ${imageId?.substring(0, 8)}:`, error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Replace invalid image references
   */
  function replaceInvalidImageReferences(urlMapping) {
    const parallaxReplace = (sections) => {
      sections.forEach(section => {
        if (section.type === 'parallax' && section.slides) {
          section.slides.forEach(slide => {
            if (slide.background && slide.background.bgImg) {
              const oldId = extractImageId(slide.background.bgImg)
              if (oldId && urlMapping[oldId]) {
                slide.background.bgImg = urlMapping[oldId]
              }
            }
          })
        }
      })
    }
    
    parallaxReplace(store.sections)
    
    store.sections.forEach(section => {
      if (section.props?.bgImg) {
        const oldId = extractImageId(section.props.bgImg)
        if (oldId && urlMapping[oldId]) {
          section.props.bgImg = urlMapping[oldId]
        }
      }
      
      if (section.blocks) {
        section.blocks.forEach(block => {
          if (block.type === 'image' && Array.isArray(block.images)) {
            block.images.forEach(img => {
              const oldId = extractImageId(img.src)
              if (oldId && urlMapping[oldId]) {
                img.src = urlMapping[oldId]
                img.sourceType = 'local'
              }
            })
          } else if (block.type === 'fullwidth-image' && block.image) {
            const oldId = extractImageId(block.image.src)
            if (oldId && urlMapping[oldId]) {
              block.image.src = urlMapping[oldId]
              block.image.sourceType = 'local'
            }
          } else if (block.type === 'float-image' && block.image) {
            const oldId = extractImageId(block.image.src)
            if (oldId && urlMapping[oldId]) {
              block.image.src = urlMapping[oldId]
              block.image.sourceType = 'local'
            }
          }
        })
      }
    })
  }

  /**
   * Validate and re-upload invalid images
   */
  async function validateAndReuploadImages(localImageIds) {
    if (localImageIds.length === 0) {
      return { success: true, newImageIds: [] }
    }

    const validateImageIdsFn = await getValidateImageIdsFunction()
    const validationResult = await validateImageIdsFn(localImageIds)
    
    if (!validationResult.ok) {
      console.error('Image validation failed:', validationResult.error)
      return { success: true, newImageIds: localImageIds }
    }

    const validation = validationResult.data.validation || validationResult.data
    
    if (!validation.invalid || validation.invalid.length === 0) {
      return { success: true, newImageIds: localImageIds }
    }

    const invalidCount = validation.invalid.length
    console.warn(`Found ${invalidCount} invalid image(s), attempting to re-upload`)
    
    // Get invalid image IDs for filtering
    const invalidIds = new Set(validation.invalid.map(inv => {
      return typeof inv === 'string' ? inv : inv.imageId
    }))
    
    // Filter out invalid IDs from the list to avoid uploading them
    const validImageIds = localImageIds.filter(id => !invalidIds.has(id))
    
    const invalidImageDetails = store.collectLocalImageDetails()
    const invalidImages = invalidImageDetails.filter(detail => {
      return invalidIds.has(detail.imageId)
    })
    
    const reuploadResults = []
    const reuploadMapping = {}
    
    for (const invalidImage of invalidImages) {
      const reuploadResult = await reuploadImageFromUrl(invalidImage.url, invalidImage.imageId)
      
      if (reuploadResult.success) {
        reuploadResults.push({
          oldId: invalidImage.imageId,
          newId: reuploadResult.imageId,
          location: invalidImage.location,
          success: true
        })
        reuploadMapping[invalidImage.imageId] = reuploadResult.localUrl
        // Add the new image ID to valid list
        const newId = extractImageId(reuploadResult.localUrl)
        if (newId) {
          validImageIds.push(newId)
        }
      } else {
        reuploadResults.push({
          oldId: invalidImage.imageId,
          location: invalidImage.location,
          success: false,
          error: reuploadResult.error
        })
        console.error(`Failed to re-upload image ${invalidImage.imageId.substring(0, 8)}: ${reuploadResult.error}`)
      }
    }
    
    if (Object.keys(reuploadMapping).length > 0) {
      replaceInvalidImageReferences(reuploadMapping)
    }
    
    const successCount = reuploadResults.filter(r => r.success).length
    const failedCount = reuploadResults.filter(r => !r.success).length
    
    // Update localImageIds to only include valid IDs
    localImageIds.length = 0
    localImageIds.push(...validImageIds)
    
    if (failedCount > 0) {
      const failedDetails = reuploadResults
        .filter(r => !r.success)
        .slice(0, 3)
        .map(r => `  • ${r.oldId.substring(0, 8)}... (${r.location}): ${r.error}`)
        .join('\n')
      
      let warningMessage = `⚠️ ${failedCount} image(s) could not be automatically re-uploaded.\n\n`
      
      if (failedCount <= 3) {
        warningMessage += `Failed images:\n${failedDetails}\n\n`
      } else {
        warningMessage += `Sample failed images:\n${failedDetails}\n... and ${failedCount - 3} more\n\n`
      }
      
      if (successCount > 0) {
        warningMessage += `✅ ${successCount} image(s) were successfully re-uploaded and will be saved.\n\n`
      }
      
      warningMessage += `The failed images will be skipped during save.\n\n`
      warningMessage += `Do you want to continue?`
      
      const proceed = await dialog.warning(
        warningMessage,
        {
          title: 'Some Images Could Not Be Re-uploaded',
          icon: '⚠️',
          confirmText: 'Continue',
          cancelText: 'Cancel'
        }
      )
      
      if (!proceed) {
        return { success: false, cancelled: true }
      }
    } else if (successCount > 0) {
      await dialog.info(
        `✅ Successfully re-uploaded ${successCount} image(s).\n\nAll images are now ready to be saved.`,
        {
          title: 'Images Re-uploaded',
          icon: '✅'
        }
      )
    }

    // Return only valid image IDs (excluding invalid ones that couldn't be re-uploaded)
    return { success: true, newImageIds: localImageIds }
  }

  /**
   * Upload images to GitHub
   */
  async function uploadImagesWithHandling(localImageIds, handleImageConflicts = null) {
    if (localImageIds.length === 0) {
      return { ok: true, data: { results: { success: [], failed: [], conflicts: [] } } }
    }
    
    let uploadResult = await uploadImagesToGitHub(localImageIds)

    if (!uploadResult.ok) {
      console.error('Image upload failed:', uploadResult.error)
      
      const proceed = await dialog.warning(
        `Failed to upload images to GitHub.\n\n${uploadResult.error}\n\nImages may not display correctly on the published page.\n\nDo you want to continue anyway?`,
        {
          title: 'Upload Error',
          icon: '⚠️',
          confirmText: 'Continue Anyway',
          cancelText: 'Cancel'
        }
      )
      
      if (!proceed) {
        return { ok: false, cancelled: true }
      }
      
      return uploadResult
    }

    if (uploadResult.data.results?.conflicts && uploadResult.data.results.conflicts.length > 0) {
      if (!handleImageConflicts) {
        return uploadResult
      }

      const conflictResolutions = await handleImageConflicts(uploadResult.data.results.conflicts)

      if (!conflictResolutions) {
        return { ok: false, cancelled: true }
      }

      uploadResult = await uploadImagesToGitHub(localImageIds, conflictResolutions)

      if (!uploadResult.ok) {
        const proceed = await dialog.warning(
          `Failed to upload images after conflict resolution.\n\n${uploadResult.error}\n\nDo you want to continue anyway?`,
          {
            title: 'Upload Error',
            icon: '⚠️',
            confirmText: 'Continue Anyway',
            cancelText: 'Cancel'
          }
        )
        
        if (!proceed) {
          return { ok: false, cancelled: true }
        }
      }
    }

    if (uploadResult.data.results?.success && uploadResult.data.results.success.length > 0) {
      const urlMapping = {}
      uploadResult.data.results.success.forEach(item => {
        urlMapping[item.imageId] = item.githubUrl
      })

      store.replaceLocalUrls(urlMapping)
    }

    if (uploadResult.data.results?.failed && uploadResult.data.results.failed.length > 0) {
      console.error(`${uploadResult.data.results.failed.length} image(s) failed to upload`)
      uploadResult.data.results.failed.forEach(item => {
        console.error(`Failed: ${item.imageId} - ${item.error}`)
      })
      
      const notFoundErrors = uploadResult.data.results.failed.filter(
        item => item.error && item.error.includes('not found in database')
      )
      
      let errorMessage = `${uploadResult.data.results.failed.length} image(s) failed to upload to GitHub.\n\n`
      
      if (notFoundErrors.length > 0) {
        errorMessage += `⚠️ ${notFoundErrors.length} image(s) were not found in the database.\n`
        errorMessage += `This usually means:\n`
        errorMessage += `• The images were automatically cleaned up (older than 24 hours)\n`
        errorMessage += `• The server was restarted and temp images were cleared\n`
        errorMessage += `• The images need to be re-uploaded\n\n`
        errorMessage += `If these images are still visible in the editor, you should:\n`
        errorMessage += `1. Remove the affected images\n`
        errorMessage += `2. Re-upload them from the Image menu\n`
        errorMessage += `3. Then save again\n\n`
      }
      
      errorMessage += `These images may not display correctly on the published page.\n\nDo you want to continue?`
      
      const proceed = await dialog.warning(
        errorMessage,
        {
          title: 'Image Upload Failed',
          icon: '⚠️',
          confirmText: 'Continue Anyway',
          cancelText: 'Cancel'
        }
      )
      
      if (!proceed) {
        return { ok: false, cancelled: true }
      }
    }

    return uploadResult
  }

  /**
   * Verify all local images replaced
   */
  async function verifyLocalImagesReplaced(action = 'save') {
    const remainingLocalImages = store.collectLocalImageIds()
    
    if (remainingLocalImages.length === 0) {
      return true
    }

    console.warn('Some local images were not uploaded:', remainingLocalImages)
    
    const localImageDetails = store.collectLocalImageDetails()
    const remainingDetails = localImageDetails.filter(detail => 
      remainingLocalImages.includes(detail.imageId)
    )
    
    let errorMessage = `⚠️ ${remainingLocalImages.length} image(s) still contain localhost URLs!\n\nThese images will NOT display on the published page.\n\n`
    
    if (remainingDetails.length > 0) {
      errorMessage += 'Affected images:\n'
      remainingDetails.slice(0, 5).forEach((detail, idx) => {
        errorMessage += `${idx + 1}. ${detail.location} (ID: ${detail.imageId.substring(0, 8)}...)\n`
      })
      if (remainingDetails.length > 5) {
        errorMessage += `... and ${remainingDetails.length - 5} more\n`
      }
      errorMessage += '\n'
    }
    
    errorMessage += 'Possible causes:\n'
    errorMessage += '• Image upload to GitHub failed\n'
    errorMessage += '• Network connection issues\n'
    errorMessage += '• GitHub API rate limit exceeded\n'
    errorMessage += '• Image format or size issue\n\n'
    errorMessage += 'Recommended: Click "Cancel" and check the browser console for detailed error messages, then try uploading again.'
    
    const actionText = action === 'update' ? 'Update Anyway (Not Recommended)' : 'Save Anyway (Not Recommended)'
    
    const proceed = await dialog.danger(
      errorMessage,
      {
        title: 'Local Images Not Uploaded',
        icon: '⚠️',
        confirmText: actionText,
        cancelText: 'Cancel'
      }
    )
    
    return proceed
  }

  return {
    validateAndReuploadImages,
    uploadImagesWithHandling,
    verifyLocalImagesReplaced
  }
}

