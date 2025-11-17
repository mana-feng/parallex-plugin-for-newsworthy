/**
 * Button Handlers
 * All button functions extracted from server.js
 * 
 * This file contains 5 main button handlers:
 * 1. handlePullAllFromGitHub - Pull all pages from GitHub
 * 2. handleSmartSyncGroups - Smart sync groups (merge local and GitHub)
 * 3. handleUploadPageToGitHub - Upload a single page to GitHub
 * 4. handleDeletePage - Delete a page from database and GitHub
 * 5. handlePushGroupsToGitHub - Push groups to GitHub
 */

import { 
  uploadToGitHub, 
  deleteFromGitHub,
  uploadGroupsJson,
  downloadGroupsJson,
  uploadImageToGitHub
} from '../github.js';
import { githubConfig } from '../config-store.js';
import { groupOperations, pageOperations, groupsJsonOperations, tempImageOperations } from '../database.js';
import { 
  sortGroupsJson, 
  extractLocalImageIds, 
  replaceImageUrlsInHtml,
  isGitHubConfigured,
  getPageById
} from './buttonHelpers.js';
import { addSyncStatusToPage } from './syncStatusManager.js';
import { handlePullAll } from './pullAllAPI.js';

/**
 * 1. Pull All from GitHub
 * Downloads all HTML files from GitHub and saves them to local database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handlePullAllFromGitHub(req, res) {
  return handlePullAll(req, res);
}

/**
 * 2. Smart Sync Groups
 * Merges local and GitHub groups, uploads only if changed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleSmartSyncGroups(req, res) {
  try {
    if (!isGitHubConfigured()) {
      throw new Error('GitHub not configured');
    }

    console.log('Starting smart sync...');

    const localJson = groupsJsonOperations.exportToJson();
    console.log(`Local groups: ${localJson.groups.length} groups`);

    let githubJson = null;
    let hasGitHubJson = false;
    
    try {
      const result = await downloadGroupsJson();
      if (result.success && result.data) {
        githubJson = result.data;
        hasGitHubJson = true;
        console.log(`GitHub groups: ${githubJson.groups.length} groups`);
      }
    } catch (error) {
      console.log('No groups.json on GitHub yet, will create new one');
      githubJson = { version: '1.0', groups: [] };
    }

    const mergedGroups = new Map();
    
    for (const group of localJson.groups) {
      mergedGroups.set(group.name, {
        ...group,
        source: 'local'
      });
    }
    
    if (hasGitHubJson && githubJson.groups) {
      for (const group of githubJson.groups) {
        if (!mergedGroups.has(group.name)) {
          mergedGroups.set(group.name, {
            ...group,
            source: 'github'
          });
        }
      }
    }

    const mergedJson = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      groups: Array.from(mergedGroups.values()).map(({ source, ...group }) => group)
    };
    
    console.log(`Merged result: ${mergedJson.groups.length} groups`);

    const needsUpload = !hasGitHubJson || 
      JSON.stringify(sortGroupsJson(githubJson)) !== JSON.stringify(sortGroupsJson(mergedJson));

    if (!needsUpload) {
      console.log('No changes detected, skipping upload');
      return res.json({
        success: true,
        action: 'no_change',
        message: 'Groups are already in sync',
        stats: {
          local: localJson.groups.length,
          github: githubJson?.groups?.length || 0,
          merged: mergedJson.groups.length
        }
      });
    }

    // Upload merged JSON to GitHub
    console.log('Changes detected, uploading to GitHub...');
    const mergedJsonString = JSON.stringify(mergedJson, null, 2);
    await uploadGroupsJson(mergedJsonString);
    
    // Import merged data back to local database to keep everything in sync
    const importStats = groupsJsonOperations.importFromJson(mergedJson);
    
    console.log('Smart sync completed successfully');
    
    res.json({
      success: true,
      action: 'synced',
      message: 'Groups synced successfully',
      stats: {
        local: localJson.groups.length,
        github: githubJson?.groups?.length || 0,
        merged: mergedJson.groups.length,
        import: importStats
      }
    });

  } catch (error) {
    console.error('Smart sync groups error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 3. Upload Page to GitHub
 * Uploads a page and its images to GitHub, converts local image links to GitHub links
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleUploadPageToGitHub(req, res) {
  try {
    const { id } = req.params;
    // Get PORT from app settings or environment
    const PORT = req.app?.locals?.port || process.env.PORT || 3001;
    
    const page = getPageById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (!page.html_content) {
      return res.status(400).json({ error: 'Page has no HTML content to upload' });
    }

    let htmlContent = page.html_content;
    const imageUrlMapping = {}; // Map from local URL to GitHub URL

    // Extract all local image IDs from HTML
    const localImageIds = extractLocalImageIds(htmlContent);

    console.log(`Uploading page "${page.title}" with ${localImageIds.size} local images`);

    // Upload each local image to GitHub
    for (const imageId of localImageIds) {
      try {
        const imageRecord = tempImageOperations.getById.get(imageId);
        if (!imageRecord) {
          console.warn(`Image ${imageId} not found in local database, skipping`);
          continue;
        }

        // Generate filename from image record
        const filename = imageRecord.filename || `image-${imageId.substring(0, 8)}.png`;
        
        // Upload image to GitHub
        const uploadResult = await uploadImageToGitHub(
          imageRecord.image_data,
          filename,
          null, // Use current date
          true, // Overwrite if exists
          null  // No existing SHA
        );

        if (uploadResult.success) {
          // Map both local:// and localhost URLs to GitHub URL
          imageUrlMapping[`local://${imageId}`] = uploadResult.url;
          imageUrlMapping[`http://localhost:${PORT}/api/images/temp/${imageId}`] = uploadResult.url;
          imageUrlMapping[`https://localhost:${PORT}/api/images/temp/${imageId}`] = uploadResult.url;
          console.log(`Uploaded image ${imageId.substring(0, 8)} to ${uploadResult.url}`);
        } else {
          console.error(`  ✗ Failed to upload image ${imageId}:`, uploadResult.message);
        }
      } catch (error) {
        console.error(`  ✗ Error uploading image ${imageId}:`, error.message);
      }
    }

    // Replace local URLs with GitHub URLs in HTML
    htmlContent = replaceImageUrlsInHtml(htmlContent, imageUrlMapping);

    // Upload HTML to GitHub
    let githubUrl = null;
    try {
      const githubResult = await uploadToGitHub(page.filename, htmlContent);
      githubUrl = githubResult.url;
      
      // Update page with GitHub URL and last_uploaded_at timestamp
      pageOperations.update.run({
        id: parseInt(id),
        title: page.title,
        filename: page.filename,
        github_url: githubUrl,
        group_id: page.group_id,
        sort_order: page.sort_order,
        html_content: page.html_content, // Keep original HTML with local links
        sections_data: page.sections_data,
        preview_image: page.preview_image,
        last_uploaded_at: new Date().toISOString()
      });

      // Get updated page with sync status
      const updatedPage = pageOperations.getById.get(parseInt(id));
      const pageWithStatus = addSyncStatusToPage(updatedPage);

      console.log(`Successfully uploaded page "${page.title}" to GitHub: ${githubUrl}`);
      
      res.json({
        success: true,
        github_url: githubUrl,
        images_uploaded: Object.keys(imageUrlMapping).length,
        message: `Successfully uploaded page "${page.title}" to GitHub`,
        page: pageWithStatus // Include updated page with sync status
      });
    } catch (error) {
      console.error('GitHub upload failed:', error);
      res.status(500).json({ 
        error: 'Failed to upload page to GitHub',
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Upload page error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 4. Delete Page
 * Deletes a page from both database and GitHub
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleDeletePage(req, res) {
  try {
    const { id } = req.params;
    
    const page = getPageById(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete from GitHub - use github_url which contains the full path (e.g., "2025/10/filename.html")
    if (page.github_url) {
      try {
        await deleteFromGitHub(page.github_url);
        console.log(`Deleted from GitHub: ${page.github_url}`);
      } catch (error) {
        console.error('GitHub delete failed:', error);
        // Don't continue if GitHub delete fails - return error to user
        return res.status(500).json({ 
          error: 'Failed to delete from GitHub',
          details: error.message,
          suggestion: 'The page may have already been deleted from GitHub, or there may be a connection issue. Please check your GitHub repository.'
        });
      }
    }

    // Only delete from database if GitHub delete succeeded (or no github_url)
    pageOperations.delete.run(id);
    console.log(`Deleted from database: ${page.title} (ID: ${id})`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * 5. Push Groups to GitHub
 * Uploads groups.json to GitHub
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handlePushGroupsToGitHub(req, res) {
  try {
    const config = githubConfig.getConfig();
    if (!config || !config.token) {
      console.log('GitHub not configured, skipping groups sync');
      return res.status(400).json({ error: 'GitHub not configured' });
    }

    const jsonString = groupsJsonOperations.exportToJsonString();
    await uploadGroupsJson(jsonString);
    console.log('Groups synced to GitHub');
    
    res.json({ success: true, message: 'Groups synced to GitHub successfully' });
  } catch (error) {
    console.error('Sync groups to GitHub error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Pull Groups from GitHub (helper function, not a button but used by sync)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handlePullGroupsFromGitHub(req, res) {
  try {
    const result = await downloadGroupsJson();
    
    if (!result.success) {
      if (result.notFound) {
        console.log('No groups.json found on GitHub');
        return res.json({ success: true, message: 'No groups found', stats: null });
      }
      throw new Error(result.message || 'Failed to download groups');
    }

    const stats = groupsJsonOperations.importFromJson(result.data);
    console.log('Groups pulled from GitHub:', stats);
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Pull groups from GitHub error:', error);
    res.status(500).json({ error: error.message });
  }
}

