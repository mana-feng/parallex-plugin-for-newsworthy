/**
 * Parallax API
 * 
 * Note: Parallax sections primarily use the existing image API endpoints
 * for handling background images. This file is maintained for consistency
 * and potential future parallax-specific endpoints.
 */

/**
 * Parallax API Router
 * @param {Express} app - Express app instance
 */
export function setupParallaxAPI(app) {
  // Currently, parallax sections use the existing image API endpoints:
  // - POST /api/images/temp/save - For saving parallax background images
  // - GET /api/images/temp/:imageId - For retrieving parallax background images
  // - POST /api/images/upload-to-github - For uploading parallax backgrounds to GitHub
  
  // Future parallax-specific endpoints can be added here if needed
  // For example:
  // - GET /api/parallax/templates - Get parallax templates
  // - POST /api/parallax/validate - Validate parallax section structure
  // etc.
}

