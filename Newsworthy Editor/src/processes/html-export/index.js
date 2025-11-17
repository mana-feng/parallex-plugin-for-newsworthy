/**
 * HTML Export Process
 * Main entry point for HTML export functionality
 */

import { processSectionsForExport, blobUrlToBase64 } from './exportHelpers'
import { buildCompleteHTML } from './htmlBuilder'

/**
 * Export editor sections to HTML
 * @param {Array} sections - Sections array from editor store
 * @returns {Promise<string>} - Complete HTML document string
 */
export async function exportToHTML(sections) {
    // Step 1: Process sections to convert blob URLs to base64
    const processedSections = await processSectionsForExport(sections, blobUrlToBase64)

    // Step 2: Build complete HTML document
    const htmlContent = buildCompleteHTML(processedSections)

    return htmlContent
}

// Export helpers for use in other modules
export { blobUrlToBase64, processSectionsForExport } from './exportHelpers'
export { buildCompleteHTML, buildHTMLBody } from './htmlBuilder'

