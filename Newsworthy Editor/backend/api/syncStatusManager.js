/**
 * Sync Status Manager
 * Handles all sync status related functionality
 * 
 * This module provides functions to:
 * - Calculate sync status for pages
 * - Add sync status to page objects
 * - Update sync status after operations
 */

/**
 * Normalize SQLite timestamp to UTC
 * SQLite's CURRENT_TIMESTAMP returns UTC time in format 'YYYY-MM-DD HH:MM:SS'
 * But JavaScript Date() interprets this as local time, causing timezone issues
 * @param {string} timestamp - SQLite timestamp string
 * @returns {Date} Date object in UTC
 */
function normalizeTimestamp(timestamp) {
  if (!timestamp) return null;
  
  // If timestamp already has timezone info (ISO 8601 with Z), use it directly
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    return new Date(timestamp);
  }
  
  // SQLite CURRENT_TIMESTAMP format: 'YYYY-MM-DD HH:MM:SS' (UTC but no timezone marker)
  // Add 'Z' to explicitly mark it as UTC
  return new Date(timestamp.replace(' ', 'T') + 'Z');
}

/**
 * Determine sync status of a page
 * @param {Object} page - Page object from database
 * @returns {string} Sync status: 'local-only', 'synced', or 'out-of-sync'
 */
export function getSyncStatus(page) {
  // If no github_url, it's only in local database
  if (!page.github_url) {
    return 'local-only';
  }
  
  // If has github_url but no last_uploaded_at, assume it's synced (old data)
  if (!page.last_uploaded_at) {
    return 'synced';
  }
  
  // Normalize timestamps to UTC for proper comparison
  const updatedAt = normalizeTimestamp(page.updated_at);
  const lastUploadedAt = normalizeTimestamp(page.last_uploaded_at);
  
  if (!updatedAt || !lastUploadedAt) {
    return 'synced'; // Fallback if timestamps are invalid
  }
  
  // If local was updated after last upload, it's out of sync
  // Add a small tolerance (1 second) to account for timing differences
  const timeDiff = updatedAt.getTime() - lastUploadedAt.getTime();
  if (timeDiff > 1000) {
    return 'out-of-sync';
  }
  
  // Otherwise, it's synced
  return 'synced';
}

/**
 * Add sync status to a single page object
 * @param {Object} page - Page object from database
 * @returns {Object} Page object with sync_status added
 */
export function addSyncStatusToPage(page) {
  if (!page) {
    return null;
  }
  
  return {
    ...page,
    sync_status: getSyncStatus(page)
  };
}

/**
 * Add sync status to an array of pages
 * @param {Array<Object>} pages - Array of page objects from database
 * @returns {Array<Object>} Array of page objects with sync_status added
 */
export function addSyncStatusToPages(pages) {
  if (!Array.isArray(pages)) {
    return [];
  }
  
  return pages.map(page => addSyncStatusToPage(page));
}

/**
 * Update last_uploaded_at timestamp for a page (after successful GitHub upload)
 * This should be called after uploading a page to GitHub to mark it as synced
 * @param {Object} pageOperations - Database operations object for pages
 * @param {number} pageId - ID of the page to update
 * @returns {Object|null} Updated page object or null if not found
 */
export function updatePageUploadTimestamp(pageOperations, pageId) {
  try {
    const page = pageOperations.getById.get(pageId);
    if (!page) {
      console.error(`Page ${pageId} not found for upload timestamp update`);
      return null;
    }

    // Update only the last_uploaded_at timestamp
    pageOperations.update.run({
      id: parseInt(pageId),
      title: page.title,
      filename: page.filename,
      github_url: page.github_url,
      group_id: page.group_id,
      sort_order: page.sort_order,
      html_content: page.html_content,
      sections_data: page.sections_data,
      preview_image: page.preview_image,
      last_uploaded_at: new Date().toISOString()
    });

    const updatedPage = pageOperations.getById.get(pageId);
    return addSyncStatusToPage(updatedPage);
  } catch (error) {
    console.error(`Error updating upload timestamp for page ${pageId}:`, error);
    return null;
  }
}

