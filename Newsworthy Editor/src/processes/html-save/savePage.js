/**
 * Save Page Process
 * Handles saving new pages to the database
 */

import { exportToHTML } from '@/processes/html-export'
import { prepareSectionsForSave } from './saveHelpers'
import { usePageSave } from '@/composables/usePageSave'
import { createPage } from '@/services/apiService'
import * as dialog from '@/utils/dialog'

/**
 * Save a new page to the local database
 * @param {Object} options - Save options
 * @param {string} options.title - Page title
 * @param {string} options.filename - Page filename
 * @param {Array} options.sections - Sections array from editor store
 * @param {Function} options.generatePreviewImage - Function to generate preview image
 * @param {Function} options.collectLocalImageIds - Function to collect local image IDs
 * @returns {Promise<Object>} - Save result with ok status and data/error
 */
export async function saveNewPage({
    title,
    filename,
    sections,
    generatePreviewImage,
    collectLocalImageIds
}) {
    try {
        // Step 1: Validate images are in local database
        const { validateAndReuploadImages } = usePageSave()
        const localImageIds = collectLocalImageIds()
        const validationResult = await validateAndReuploadImages(localImageIds)
        
        if (!validationResult.success) {
            if (validationResult.cancelled) {
                return { ok: false, cancelled: true }
            }
        }

        // Step 2: Generate HTML content
        const htmlContent = await exportToHTML(sections)

        // Step 3: Prepare sections data for save
        const sectionsData = await prepareSectionsForSave(sections)

        // Step 4: Generate preview image
        const previewImage = await generatePreviewImage()

        // Step 5: Save to database
        const result = await createPage({
            title,
            filename,
            html_content: htmlContent,
            sections_data: sectionsData,
            group_id: null,
            preview_image: previewImage
        })

        if (result.ok) {
            await dialog.success(
                `"${title}" has been saved to your local database.\n\nYou can upload it to GitHub later from the Storage Manager.`,
                {
                    title: 'Page Saved Successfully!',
                    icon: '✅'
                }
            )
        } else {
            await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
                title: 'Failed to Save Page'
            })
        }

        return result
    } catch (error) {
        console.error('Save page error:', error)
        await dialog.error('Unable to reach the server.\n\nPlease ensure the backend is running and try again.', {
            title: 'Connection Error'
        })
        return { ok: false, error: error.message }
    }
}

