/**
 * Button Handlers - Shared Helper Functions
 * Common utilities used by multiple button handlers
 */

import { githubConfig } from '../config-store.js';
import { pageOperations } from '../database.js';

/**
 * Helper function to sort groups JSON for comparison
 * Ensures consistent ordering for accurate comparison
 * @param {Object} json - Groups JSON object
 * @returns {Object} Sorted groups JSON
 */
export function sortGroupsJson(json) {
  if (!json || !json.groups) return json;
  
  return {
    version: json.version,
    groups: [...json.groups].sort((a, b) => {
      // Sort by name for consistent comparison
      return a.name.localeCompare(b.name);
    })
  };
}

/**
 * Extract local image IDs from HTML content
 * @param {string} htmlContent - HTML content string
 * @returns {Set<string>} Set of image IDs found in HTML
 */
export function extractLocalImageIds(htmlContent) {
  const localImageIds = new Set();
  
  // Pattern 1: local://{imageId}
  const localUrlPattern = /local:\/\/([a-f0-9-]{36})/gi;
  // Pattern 2: http://localhost:PORT/api/images/temp/{imageId}
  const localhostUrlPattern = /https?:\/\/localhost:\d+\/api\/images\/temp\/([a-f0-9-]{36})/gi;
  
  let match;
  
  // Find all local:// URLs
  while ((match = localUrlPattern.exec(htmlContent)) !== null) {
    localImageIds.add(match[1]);
  }
  
  // Find all localhost URLs
  while ((match = localhostUrlPattern.exec(htmlContent)) !== null) {
    localImageIds.add(match[1]);
  }
  
  return localImageIds;
}

/**
 * Replace image URLs in HTML content
 * Preserves all other attributes (style, class, alt, width, height, etc.)
 * @param {string} htmlContent - Original HTML content
 * @param {Object} imageUrlMapping - Mapping from local URLs to GitHub URLs
 * @returns {string} HTML content with replaced URLs
 */
export function replaceImageUrlsInHtml(htmlContent, imageUrlMapping) {
  let convertedHtml = htmlContent;
  
  // Replace local URLs with GitHub URLs in HTML
  // Use a more precise approach that only replaces URLs within img src attributes
  // This preserves all other attributes (style, class, alt, width, height, etc.)
  for (const [localUrl, githubUrl] of Object.entries(imageUrlMapping)) {
    // Escape special regex characters for URL matching
    const escapedLocalUrl = localUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern 1: Match src attribute in img tags with double quotes
    // This pattern matches: <img ... src="localUrl" ...> 
    // Captures: ($1) everything before and including src=", ($2) everything after "
    const imgSrcDoubleQuotePattern = new RegExp(
      `(<img[^>]*\\ssrc=")${escapedLocalUrl}(")`,
      'gi'
    );
    convertedHtml = convertedHtml.replace(imgSrcDoubleQuotePattern, `$1${githubUrl}$2`);
    
    // Pattern 2: Match src attribute in img tags with single quotes
    // This pattern matches: <img ... src='localUrl' ...>
    const imgSrcSingleQuotePattern = new RegExp(
      `(<img[^>]*\\ssrc=')${escapedLocalUrl}(')`,
      'gi'
    );
    convertedHtml = convertedHtml.replace(imgSrcSingleQuotePattern, `$1${githubUrl}$2`);
    
    // Pattern 3: Handle src without quotes (edge case, but still preserves other attributes)
    // This pattern matches: <img ... src=localUrl ...>
    const imgSrcNoQuotePattern = new RegExp(
      `(<img[^>]*\\ssrc=)${escapedLocalUrl}([\\s>])`,
      'gi'
    );
    convertedHtml = convertedHtml.replace(imgSrcNoQuotePattern, `$1${githubUrl}$2`);
  }
  
  return convertedHtml;
}

/**
 * Check if GitHub is configured
 * @returns {boolean} True if GitHub is configured
 */
export function isGitHubConfigured() {
  const config = githubConfig.getConfig();
  return config && config.token;
}

/**
 * Get page by ID with error handling
 * @param {number|string} id - Page ID
 * @returns {Object|null} Page object or null if not found
 */
export function getPageById(id) {
  try {
    return pageOperations.getById.get(id);
  } catch (error) {
    console.error(`Error getting page ${id}:`, error);
    return null;
  }
}

