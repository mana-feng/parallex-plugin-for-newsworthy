/**
 * HTML Save Helpers
 * Utility functions for preparing data before saving
 */

import * as parallaxService from '@/services/parallaxService'
import { blobUrlToBase64 } from '@/processes/html-export'

/**
 * Prepare sections data for saving to database
 * Converts blob URLs to base64 and processes parallax sections
 * @param {Array} sections - Sections array from editor store
 * @param {Function} blobUrlToBase64Fn - Function to convert blob URLs (optional, uses default if not provided)
 * @returns {Promise<Array>} - Prepared sections array
 */
export async function prepareSectionsForSave(sections, blobUrlToBase64Fn = blobUrlToBase64) {
    const sectionsClone = await parallaxService.prepareParallaxSectionsForSave(sections, blobUrlToBase64Fn)

    for (const section of sectionsClone) {
        // Process section background image
        if (section.props?.bgImg && section.props.bgImg.startsWith('blob:')) {
            section.props.bgImg = await blobUrlToBase64Fn(section.props.bgImg)
        }

        // Process block images
        if (section.blocks) {
            for (const block of section.blocks) {
                if (block.type === 'image' && block.images && Array.isArray(block.images)) {
                    for (const img of block.images) {
                        if (img.src && img.src.startsWith('blob:')) {
                            img.src = await blobUrlToBase64Fn(img.src)
                        }
                    }
                } else if (block.type === 'fullwidth-image' && block.image) {
                    if (block.image.src && block.image.src.startsWith('blob:')) {
                        block.image.src = await blobUrlToBase64Fn(block.image.src)
                    }
                } else if (block.type === 'float-image' && block.image) {
                    if (block.image.src && block.image.src.startsWith('blob:')) {
                        block.image.src = await blobUrlToBase64Fn(block.image.src)
                    }
                }
            }
        }
    }

    return sectionsClone
}

