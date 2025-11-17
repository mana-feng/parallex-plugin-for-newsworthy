import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { groupOperations, pageOperations, tempImageOperations } from './database.js';
import { 
  uploadToGitHub, 
  deleteFromGitHub, 
  listGitHubFiles, 
  validateGitHubConfig,
  testGitHubConfig,
  getFileFromGitHub,
  syncWithGitHub,
  getAllFilesFromGitHub,
  pullAllFromGitHub,
  uploadGroupsJson,
  downloadGroupsJson,
  uploadImageToGitHub
} from './github.js';
import { setupImageBlockAPI } from './imageBlockAPI.js';
import { setupParallaxAPI } from './parallaxAPI.js';
import { 
  handlePullAllFromGitHub,
  handleSmartSyncGroups,
  handleUploadPageToGitHub,
  handleDeletePage,
  handlePushGroupsToGitHub,
  handlePullGroupsFromGitHub
} from './api/buttonHandlers.js';
import { addSyncStatusToPage, addSyncStatusToPages } from './api/syncStatusManager.js';
import { githubConfig } from './config-store.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));


// Button handler functions moved to ./api/buttonHandlers.js


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub configuration check
app.get('/api/github/status', async (req, res) => {
  try {
    const isValid = await validateGitHubConfig();
    const config = githubConfig.getConfig();
    res.json({ 
      configured: isValid,
      owner: config?.owner,
      repo: config?.repo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get GitHub settings
app.get('/api/settings/github', (req, res) => {
  try {
    const config = githubConfig.getConfig();
    if (config) {
      // Don't send the token back for security
      res.json({
        configured: true,
        config: {
          owner: config.owner,
          repo: config.repo,
          branch: config.branch,
          baseUrl: config.baseUrl
        }
      });
    } else {
      res.json({ configured: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save GitHub settings
app.post('/api/settings/github', async (req, res) => {
  try {
    const { token, owner, repo, branch, baseUrl } = req.body;

    if (!token || !owner || !repo || !branch) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, owner, repo, branch' 
      });
    }

    // Test the configuration first
    const testResult = await testGitHubConfig({ token, owner, repo });
    if (!testResult.success) {
      return res.status(400).json({ 
        error: `Invalid GitHub configuration: ${testResult.error}` 
      });
    }

    // Save configuration
    githubConfig.set({
      token,
      owner,
      repo,
      branch,
      baseUrl: baseUrl || `https://${owner}.github.io/${repo}`
    });

    res.json({ 
      success: true, 
      message: 'GitHub configuration saved successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test GitHub configuration
app.post('/api/settings/github/test', async (req, res) => {
  try {
    const { token, owner, repo } = req.body;

    if (!token || !owner || !repo) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, owner, repo' 
      });
    }

    const result = await testGitHubConfig({ token, owner, repo });
    
    if (result.success) {
      res.json({ success: true, message: 'Connection successful' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get all groups
app.get('/api/groups', (req, res) => {
  try {
    const groups = groupOperations.getAll.all();
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create group
app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const result = groupOperations.create.run({
      name,
      description: description || null,
      color: color || '#3b82f6'
    });

    const newGroup = groupOperations.getById.get(result.lastInsertRowid);
    
    // Note: Auto-sync disabled. Use "Push to GitHub" button to sync manually.
    
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update group
app.put('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    groupOperations.update.run({
      id: parseInt(id),
      name,
      description: description || null,
      color: color || '#3b82f6'
    });

    const updatedGroup = groupOperations.getById.get(id);
    
    // Note: Auto-sync disabled. Use "Push to GitHub" button to sync manually.
    
    res.json(updatedGroup);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete group
app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    groupOperations.delete.run(id);
    
    // Note: Auto-sync disabled. Use "Push to GitHub" button to sync manually.
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Button handlers - Groups sync
app.post('/api/groups/sync/push', handlePushGroupsToGitHub);
app.post('/api/groups/sync/pull', handlePullGroupsFromGitHub);
app.post('/api/groups/sync/smart', handleSmartSyncGroups);


// Setup image block API routes
setupImageBlockAPI(app, PORT);
setupParallaxAPI(app);

// Upload image to GitHub (legacy endpoint - kept for compatibility)
app.post('/api/images/upload', async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ 
        error: 'Image data and filename are required' 
      });
    }

    // Upload image to GitHub
    const result = await uploadImageToGitHub(imageData, filename);
    
    res.json({
      success: true,
      url: result.url,
      relativePath: result.relativePath,
      filename: result.filename
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get all pages
app.get('/api/pages', (req, res) => {
  try {
    const { group_id, search } = req.query;
    
    let pages;
    if (search) {
      pages = pageOperations.search.all({ query: `%${search}%` });
    } else if (group_id) {
      pages = pageOperations.getByGroup.all(group_id);
    } else {
      pages = pageOperations.getAll.all();
    }
    
    // Add sync status to each page
    const pagesWithStatus = addSyncStatusToPages(pages);
    
    res.json(pagesWithStatus);
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single page
app.get('/api/pages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const page = pageOperations.getById.get(id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    // Add sync status
    const pageWithStatus = addSyncStatusToPage(page);
    
    res.json(pageWithStatus);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create page - save to local database only (no GitHub upload)
app.post('/api/pages', async (req, res) => {
  try {
    const { title, filename, html_content, sections_data, group_id, preview_image } = req.body;
    
    if (!title || !filename || !html_content) {
      return res.status(400).json({ 
        error: 'Title, filename, and HTML content are required' 
      });
    }

    // Save to local database only (no GitHub upload)
    // GitHub upload will be done separately via /api/pages/:id/upload endpoint

    // Get max sort order
    const allPages = pageOperations.getAll.all();
    const maxSortOrder = allPages.length > 0 
      ? Math.max(...allPages.map(p => p.sort_order || 0)) 
      : 0;

    // Save to database with github_url as null (will be set when uploaded)
    const result = pageOperations.create.run({
      title,
      filename: filename.endsWith('.html') ? filename : `${filename}.html`,
      github_url: null, // Will be set when uploaded to GitHub
      group_id: group_id || null,
      sort_order: maxSortOrder + 1,
      html_content,
      sections_data: sections_data ? JSON.stringify(sections_data) : null,
      preview_image: preview_image || null
    });

    const newPage = pageOperations.getById.get(result.lastInsertRowid);
    console.log(`Saved page to local database: "${title}" (ID: ${newPage.id})`);
    res.status(201).json(newPage);
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update page - save to local database only (no GitHub upload)
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, filename, html_content, sections_data, group_id, sort_order, preview_image } = req.body;

    const existingPage = pageOperations.getById.get(id);
    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Update local database only (no GitHub upload)
    // GitHub upload will be done separately via /api/pages/:id/upload endpoint
    // Preserve github_url if it exists (it will be updated when re-uploaded)

    // Update database
    pageOperations.update.run({
      id: parseInt(id),
      title: title || existingPage.title,
      filename: filename || existingPage.filename,
      github_url: existingPage.github_url, // Preserve existing github_url, will be updated on upload
      group_id: group_id !== undefined ? group_id : existingPage.group_id,
      sort_order: sort_order !== undefined ? sort_order : existingPage.sort_order,
      html_content: html_content || existingPage.html_content,
      sections_data: sections_data !== undefined ? (sections_data ? JSON.stringify(sections_data) : null) : existingPage.sections_data,
      preview_image: preview_image !== undefined ? preview_image : existingPage.preview_image,
      last_uploaded_at: existingPage.last_uploaded_at // Preserve last_uploaded_at (will be updated when uploaded)
    });

    const updatedPage = pageOperations.getById.get(id);
    console.log(`Updated page in local database: "${updatedPage.title}" (ID: ${id})`);
    
    // Add sync status to response
    const pageWithStatus = addSyncStatusToPage(updatedPage);
    
    res.json(pageWithStatus);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update page by filename (for updating from editor) - save to local database only
app.put('/api/pages/by-filename/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { title, html_content, sections_data } = req.body;

    const existingPage = pageOperations.getByFilename.get(filename);
    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Update local database only (no GitHub upload)
    // GitHub upload will be done separately via /api/pages/:id/upload endpoint

    // Update database
    pageOperations.update.run({
      id: existingPage.id,
      title: title || existingPage.title,
      filename: existingPage.filename,
      github_url: existingPage.github_url, // Preserve existing github_url
      group_id: existingPage.group_id,
      sort_order: existingPage.sort_order,
      html_content: html_content || existingPage.html_content,
      sections_data: sections_data !== undefined ? (sections_data ? JSON.stringify(sections_data) : null) : existingPage.sections_data,
      preview_image: existingPage.preview_image,
      last_uploaded_at: existingPage.last_uploaded_at // Preserve last_uploaded_at (will be updated when uploaded)
    });

    const updatedPage = pageOperations.getById.get(existingPage.id);
    console.log(`Updated page in local database (by filename): "${updatedPage.title}" (ID: ${existingPage.id})`);
    
    // Add sync status to response
    const pageWithStatus = addSyncStatusToPage(updatedPage);
    
    res.json(pageWithStatus);
  } catch (error) {
    console.error('Update page by filename error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update multiple pages sort order
app.post('/api/pages/reorder', (req, res) => {
  try {
    const { pages } = req.body; // Array of { id, sort_order }
    
    if (!Array.isArray(pages)) {
      return res.status(400).json({ error: 'Pages array is required' });
    }

    pages.forEach(({ id, sort_order }) => {
      pageOperations.updateSortOrder.run({ id, sort_order });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder pages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Button handlers - Page operations
app.post('/api/pages/:id/upload', handleUploadPageToGitHub);
app.delete('/api/pages/:id', handleDeletePage);

// List files from GitHub
app.get('/api/github/files', async (req, res) => {
  try {
    const files = await listGitHubFiles();
    res.json(files);
  } catch (error) {
    console.error('List GitHub files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific file content from GitHub
app.get('/api/github/file/:path(*)', async (req, res) => {
  try {
    const { path } = req.params;
    const fileData = await getFileFromGitHub(decodeURIComponent(path));
    res.json(fileData);
  } catch (error) {
    console.error('Get GitHub file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all files with content from GitHub
app.get('/api/github/files/all', async (req, res) => {
  try {
    const files = await getAllFilesFromGitHub();
    res.json(files);
  } catch (error) {
    console.error('Get all GitHub files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Button handlers - GitHub operations
app.post('/api/github/pull-all', handlePullAllFromGitHub);

// Sync file with GitHub
app.post('/api/github/sync', async (req, res) => {
  try {
    const { filePath, localContent } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const syncResult = await syncWithGitHub(filePath, localContent);
    res.json(syncResult);
  } catch (error) {
    console.error('GitHub sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pull file from GitHub (download and load into editor)
app.post('/api/github/pull', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fileData = await getFileFromGitHub(filePath);
    
    // Extract title from HTML content
    const titleMatch = fileData.content.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : fileData.name.replace('.html', '');
    
    // Extract filename from path
    const filename = fileData.name;
    
    res.json({
      success: true,
      fileData,
      title,
      filename,
      content: fileData.content
    });
  } catch (error) {
    console.error('GitHub pull error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clean up temp images from HTML content
 */
function cleanupTempImagesFromHtml(htmlContent) {
  if (!htmlContent) return 0;
  
  const localUrlPattern = /(?:local:\/\/|http:\/\/localhost:\d+\/api\/images\/temp\/)([a-f0-9-]{36})/gi;
  const matches = htmlContent.matchAll(localUrlPattern);
  
  const imageIds = new Set();
  for (const match of matches) {
    imageIds.add(match[1]);
  }
  
  if (imageIds.size === 0) return 0;
  
  console.log(`Found ${imageIds.size} temp images to clean up:`, Array.from(imageIds));
  
  let cleanedCount = 0;
  for (const imageId of imageIds) {
    try {
      const result = tempImageOperations.delete.run(imageId);
      if (result.changes > 0) {
        cleanedCount++;
        console.log(`  Deleted temp image: ${imageId}`);
      }
    } catch (error) {
      console.error(`  Failed to delete temp image ${imageId}:`, error.message);
    }
  }
  
  return cleanedCount;
}

// Delete single temp image
app.delete('/api/images/temp/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const result = tempImageOperations.delete.run(imageId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    console.log(`Deleted temp image: ${imageId}`);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete temp image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message 
    });
  }
});


// [TEMP_IMAGE_CLEANUP #7] Manual trigger for auto cleanup (with configurable age)
app.post('/api/images/temp/cleanup', async (req, res) => {
  try {
    const { hoursOld } = req.body;
    const hours = hoursOld || 24; // Default to 24 hours
    
    console.log(`Manual cleanup triggered: deleting images older than ${hours} hours`);
    const result = cleanupOldTempImages(hours);
    
    res.json({
      success: result.success,
      deleted: result.deleted,
      hoursOld: result.hoursOld,
      timestamp: result.timestamp,
      message: result.success 
        ? `Successfully deleted ${result.deleted} images older than ${hours} hours`
        : `Cleanup failed: ${result.error}`
    });
  } catch (error) {
    console.error('Manual cleanup failed:', error);
    res.status(500).json({ 
      error: 'Failed to run cleanup',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});


/**
 * Clean up old temp images (older than specified hours)
 * This helps prevent database bloat from unused uploaded images
 * @param {number} hoursOld - Delete images older than this many hours (default: 24)
 */
function cleanupOldTempImages(hoursOld = 24) {
  try {
    // First, check how many images will be deleted
    const countResult = tempImageOperations.countOlderThan.get(hoursOld);
    const oldCount = countResult.count;
    
    if (oldCount === 0) {
      console.log(`[Auto Cleanup] No temporary images older than ${hoursOld} hours to clean up`);
      return {
        success: true,
        deleted: 0,
        hoursOld: hoursOld,
        timestamp: new Date().toISOString()
      };
    }
    
    // Delete images older than specified hours
    const result = tempImageOperations.deleteOlderThan.run(hoursOld);
    
    console.log(`[Auto Cleanup] Deleted ${result.changes} temporary images older than ${hoursOld} hours`);
    
    return {
      success: true,
      deleted: result.changes,
      hoursOld: hoursOld,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Auto Cleanup] Failed to clean up temp images:', error.message);
    return {
      success: false,
      error: error.message,
      hoursOld: hoursOld,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Schedule automatic cleanup of temp images
 * Runs every day at 00:00 (midnight)
 */
function scheduleAutoCleanup() {
  // Schedule task to run every day at 00:00
  // Cron format: second minute hour day month weekday
  // '0 0 * * *' = at 00:00 every day
  cron.schedule('0 0 * * *', () => {
    console.log('\n[Scheduled Task] Running daily temp image cleanup at 00:00...');
    const result = cleanupOldTempImages();
    console.log(`[Scheduled Task] Cleanup result:`, result);
  }, {
    scheduled: true,
    timezone: "Asia/Shanghai" // Use China timezone, can be modified as needed
  });

  console.log('Scheduled automatic cleanup: Every day at 00:00');
  console.log('Timezone: Asia/Shanghai (UTC+8)');
}

// Start server
app.listen(PORT, () => {
  // Store PORT in app locals for use in handlers
  app.locals.port = PORT;
  
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  
  // Initialize auto cleanup scheduler
  scheduleAutoCleanup();
  
  // Run cleanup once on server start to clean up from previous sessions
  console.log('\nRunning initial cleanup on server start...');
  const initialCleanup = cleanupOldTempImages();
  console.log(`Initial cleanup result:`, initialCleanup);
});

