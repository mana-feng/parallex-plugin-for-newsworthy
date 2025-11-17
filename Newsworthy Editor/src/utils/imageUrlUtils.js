/**
 * Image URL Utilities
 * 
 * This module provides utilities for converting between different image URL formats:
 * - local://<id> - Internal format stored in editor (localhost backend)
 * - http://localhost:3001/api/images/temp/<id> - Display URL for preview (localhost)
 */

const PORT = 3001

/**
 * Convert localhost URL to local:// format
 * @param {string} url - Image URL (localhost:3001/api/images/temp/<id>)
 * @returns {string} - local://<id> format
 */
export function localhostToLocal(url) {
  if (!url || typeof url !== 'string') return url
  
  // Match localhost:3001/api/images/temp/{id}
  const match = url.match(/^https?:\/\/localhost:\d+\/api\/images\/temp\/([a-f0-9-]+)/i)
  if (match) {
    return `local://${match[1]}`
  }
  
  // If already in local:// format, return as is
  if (url.startsWith('local://')) {
    return url
  }
  
  // If it's not a localhost URL, return as is (external URLs, etc.)
  return url
}

/**
 * Convert local:// format to localhost URL for display
 * @param {string} url - Image URL (local://<id> or localhost URL)
 * @returns {string} - http://localhost:3001/api/images/temp/<id>
 */
export function localToLocalhost(url) {
  if (!url || typeof url !== 'string') return url
  
  // Match local://{id}
  const match = url.match(/^local:\/\/([a-f0-9-]+)$/i)
  if (match) {
    return `http://localhost:${PORT}/api/images/temp/${match[1]}`
  }
  
  // If already a localhost URL, return as is
  if (url.match(/^https?:\/\/localhost:\d+\/api\/images\/temp\//i)) {
    return url
  }
  
  // If it's not a local URL, return as is (external URLs, data URLs, etc.)
  return url
}

/**
 * Convert image URL for display
 * @param {string} url - Image URL (local://<id>)
 * @returns {string} - Display URL (localhost)
 */
export function convertImageUrlForDisplay(url) {
  if (!url || typeof url !== 'string') return url
  
  // Handle local:// URLs
  if (url.startsWith('local://')) {
    return localToLocalhost(url)
  }
  
  // Return as is for other URLs
  return url
}

/**
 * Extract image ID from URL
 * @param {string} url - Image URL (any format)
 * @returns {string|null} - Image ID or null
 */
export function extractImageId(url) {
  if (!url || typeof url !== 'string') return null
  
  // Skip GitHub URLs and external URLs
  if (url.includes('github.io') || url.includes('githubusercontent') || 
      (url.startsWith('http') && !url.includes('localhost'))) {
    return null
  }
  
  // Match local://{uuid} format (UUID is 36 chars with dashes)
  const localMatch = url.match(/^local:\/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (localMatch) return localMatch[1]
  
  // Match localhost:port/api/images/temp/{uuid} format
  const localhostMatch = url.match(/\/api\/images\/temp\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
  if (localhostMatch) return localhostMatch[1]
  
  return null
}

