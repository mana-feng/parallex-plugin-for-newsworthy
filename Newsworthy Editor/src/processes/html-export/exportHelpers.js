/**
 * HTML Export Helpers
 * Utility functions for HTML export process
 */

import { localToLocalhost } from '@/utils/imageUrlUtils'

/**
 * Convert blob URL to base64 data URL
 * @param {string} blobUrl - Blob URL to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export async function blobUrlToBase64(blobUrl) {
    try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Failed to convert blob URL to base64:', err);
        return blobUrl; // Fallback to original URL
    }
}

/**
 * Convert local:// URL to base64 data URL
 * @param {string} localUrl - local:// URL to convert
 * @returns {Promise<string>} - Base64 data URL or original URL if conversion fails
 */
export async function localUrlToBase64(localUrl) {
    try {
        // Convert local:// to localhost URL
        const localhostUrl = localToLocalhost(localUrl);
        
        // Fetch the image from localhost
        const response = await fetch(localhostUrl);
        if (!response.ok) {
            console.warn(`Failed to fetch image from ${localhostUrl}: ${response.status}`);
            return localUrl; // Fallback to original URL
        }
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.error('Failed to convert local:// URL to base64:', err);
        return localUrl; // Fallback to original URL
    }
}

/**
 * Convert image URL to base64 if needed (blob: or local://)
 * @param {string} url - Image URL (blob:, local://, or regular URL)
 * @returns {Promise<string>} - Base64 data URL or original URL
 */
export async function convertImageUrlToBase64(url) {
    if (!url || typeof url !== 'string') {
        return url;
    }
    
    // Handle blob URLs
    if (url.startsWith('blob:')) {
        return await blobUrlToBase64(url);
    }
    
    // Handle local:// URLs
    if (url.startsWith('local://')) {
        return await localUrlToBase64(url);
    }
    
    // Handle localhost URLs (convert to base64 for export)
    if (url.includes('localhost') && url.includes('/api/images/temp/')) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
        } catch (err) {
            console.warn('Failed to convert localhost URL to base64:', err);
        }
    }
    
    // Return as-is for external URLs, data URLs, etc.
    return url;
}

/**
 * Process sections to convert blob URLs and local:// URLs to base64
 * @param {Array} sections - Sections array
 * @param {Function} blobUrlToBase64Fn - Function to convert blob URLs (deprecated, use convertImageUrlToBase64)
 * @returns {Promise<Array>} - Processed sections
 */
export async function processSectionsForExport(sections, blobUrlToBase64Fn) {
    const sectionsClone = JSON.parse(JSON.stringify(sections));

    for (const section of sectionsClone) {
        // Process parallax slides
        if (section.type === 'parallax' && section.slides) {
            for (const slide of section.slides) {
                if (slide.bgImg) {
                    slide.bgImg = await convertImageUrlToBase64(slide.bgImg);
                }
            }
        }

        // Process section background image
        if (section.props?.bgImg) {
            section.props.bgImg = await convertImageUrlToBase64(section.props.bgImg);
        }

        // Process block images
        if (section.blocks) {
            for (const block of section.blocks) {
                if (block.type === 'image' && block.images && Array.isArray(block.images)) {
                    for (const img of block.images) {
                        if (img.src) {
                            img.src = await convertImageUrlToBase64(img.src);
                        }
                    }
                } else if (block.type === 'fullwidth-image' && block.image) {
                    if (block.image.src) {
                        block.image.src = await convertImageUrlToBase64(block.image.src);
                    }
                } else if (block.type === 'float-image' && block.image) {
                    if (block.image.src) {
                        block.image.src = await convertImageUrlToBase64(block.image.src);
                    }
                } else if (block.type === 'text' && block.html) {
                    // Process images in text block HTML (img tags with local:// or localhost URLs)
                    let html = block.html;
                    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
                    const matches = [...html.matchAll(imgRegex)];
                    
                    for (const match of matches) {
                        const originalUrl = match[1];
                        const convertedUrl = await convertImageUrlToBase64(originalUrl);
                        if (convertedUrl !== originalUrl) {
                            html = html.replace(originalUrl, convertedUrl);
                        }
                    }
                    
                    block.html = html;
                }
            }
        }
    }

    return sectionsClone;
}

