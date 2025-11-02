import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { groupOperations, pageOperations, groupsJsonOperations, tempImageOperations } from './database.js';
import { 
  uploadToGitHub, 
  deleteFromGitHub, 
  listGitHubFiles, 
  renameInGitHub,
  validateGitHubConfig,
  testGitHubConfig,
  getFileFromGitHub,
  syncWithGitHub,
  getAllFilesFromGitHub,
  pullAllFromGitHub,
  uploadGroupsJson,
  downloadGroupsJson,
  uploadImageToGitHub,
  checkImageExists,
  updateFileAtPath
} from './github.js';
import { githubConfig } from './config-store.js';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Increase payload size limits to handle large HTML files (e.g., with embedded images)
// No practical limit - let SQLite handle the size constraints
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// ============ HELPER FUNCTIONS ============

async function syncGroupsToGitHub() {
  try {
    const config = githubConfig.getConfig();
    if (!config || !config.token) {
      console.log('GitHub not configured, skipping groups sync');
      return;
    }

    const jsonString = groupsJsonOperations.exportToJsonString();
    await uploadGroupsJson(jsonString);
    console.log('Groups synced to GitHub');
  } catch (error) {
    console.error('Failed to sync groups to GitHub:', error.message);
    throw error;
  }
}

async function pullGroupsFromGitHub() {
  try {
    const result = await downloadGroupsJson();
    
    if (!result.success) {
      if (result.notFound) {
        console.log('No groups.json found on GitHub');
        return { success: true, message: 'No groups found', stats: null };
      }
      throw new Error(result.message || 'Failed to download groups');
    }

    const stats = groupsJsonOperations.importFromJson(result.data);
    console.log('Groups pulled from GitHub:', stats);
    
    return { success: true, stats };
  } catch (error) {
    console.error('Failed to pull groups from GitHub:', error.message);
    throw error;
  }
}

async function smartSyncGroups() {
  try {
    const config = githubConfig.getConfig();
    if (!config || !config.token) {
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
      return {
        success: true,
        action: 'no_change',
        message: 'Groups are already in sync',
        stats: {
          local: localJson.groups.length,
          github: githubJson?.groups?.length || 0,
          merged: mergedJson.groups.length
        }
      };
    }

    // Step 5: Upload merged JSON to GitHub
    console.log('Changes detected, uploading to GitHub...');
    const mergedJsonString = JSON.stringify(mergedJson, null, 2);
    await uploadGroupsJson(mergedJsonString);
    
    // Step 6: Import merged data back to local database to keep everything in sync
    const importStats = groupsJsonOperations.importFromJson(mergedJson);
    
    console.log('Smart sync completed successfully');
    
    return {
      success: true,
      action: 'synced',
      message: 'Groups synced successfully',
      stats: {
        local: localJson.groups.length,
        github: githubJson?.groups?.length || 0,
        merged: mergedJson.groups.length,
        import: importStats
      }
    };

  } catch (error) {
    console.error('Smart sync failed:', error.message);
    throw error;
  }
}

/**
 * Helper function to sort groups JSON for comparison
 * Ensures consistent ordering for accurate comparison
 */
function sortGroupsJson(json) {
  if (!json || !json.groups) return json;
  
  return {
    version: json.version,
    groups: [...json.groups].sort((a, b) => {
      // Sort by name for consistent comparison
      return a.name.localeCompare(b.name);
    })
  };
}

// ============ API ENDPOINTS ============

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

// ============ SETTINGS ENDPOINTS ============

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

// ============ GROUP ENDPOINTS ============

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

// Manually sync groups to GitHub
app.post('/api/groups/sync/push', async (req, res) => {
  try {
    await syncGroupsToGitHub();
    res.json({ success: true, message: 'Groups synced to GitHub successfully' });
  } catch (error) {
    console.error('Sync groups to GitHub error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pull groups from GitHub and update database
app.post('/api/groups/sync/pull', async (req, res) => {
  try {
    const result = await pullGroupsFromGitHub();
    res.json(result);
  } catch (error) {
    console.error('Pull groups from GitHub error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Smart sync groups (export -> pull -> merge -> compare -> upload if changed)
app.post('/api/groups/sync/smart', async (req, res) => {
  try {
    const result = await smartSyncGroups();
    res.json(result);
  } catch (error) {
    console.error('Smart sync groups error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ IMAGE ENDPOINTS ============

// Upload image to GitHub
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

// ============ PAGE ENDPOINTS ============

// Helper function to determine sync status
function getSyncStatus(page) {
  // Check if page has github_url (synced to cloud)
  if (page.github_url) {
    return 'synced'; // Both local and cloud
  } else {
    return 'local-only'; // Only in local database
  }
}

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
    const pagesWithStatus = pages.map(page => ({
      ...page,
      sync_status: getSyncStatus(page)
    }));
    
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
    const pageWithStatus = {
      ...page,
      sync_status: getSyncStatus(page)
    };
    
    res.json(pageWithStatus);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create page and upload to GitHub
app.post('/api/pages', async (req, res) => {
  try {
    const { title, filename, html_content, sections_data, group_id, preview_image } = req.body;
    
    if (!title || !filename || !html_content) {
      return res.status(400).json({ 
        error: 'Title, filename, and HTML content are required' 
      });
    }

    // Upload to GitHub
    let githubUrl = null;
    try {
      const githubResult = await uploadToGitHub(filename, html_content);
      githubUrl = githubResult.url;
      
      // [TEMP_IMAGE_CLEANUP #1] Clean up temp images after successful GitHub upload (Create Page)
      const cleanedCount = cleanupTempImagesFromHtml(html_content);
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} temp images after GitHub upload`);
      }
    } catch (error) {
      console.error('GitHub upload failed:', error);
      // Continue even if GitHub upload fails
    }

    // Get max sort order
    const allPages = pageOperations.getAll.all();
    const maxSortOrder = allPages.length > 0 
      ? Math.max(...allPages.map(p => p.sort_order || 0)) 
      : 0;

    // Save to database
    const result = pageOperations.create.run({
      title,
      filename: filename.endsWith('.html') ? filename : `${filename}.html`,
      github_url: githubUrl,
      group_id: group_id || null,
      sort_order: maxSortOrder + 1,
      html_content,
      sections_data: sections_data ? JSON.stringify(sections_data) : null,
      preview_image: preview_image || null
    });

    const newPage = pageOperations.getById.get(result.lastInsertRowid);
    res.status(201).json(newPage);
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update page
app.put('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, filename, html_content, sections_data, group_id, sort_order, preview_image } = req.body;

    const existingPage = pageOperations.getById.get(id);
    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // If filename changed, rename in GitHub
    let githubUrl = existingPage.github_url;
    if (filename && filename !== existingPage.filename) {
      try {
        // Use github_url (full path) for old file, new filename for new file
        const githubResult = await renameInGitHub(
          existingPage.github_url || existingPage.filename, 
          filename, 
          html_content || existingPage.html_content
        );
        githubUrl = githubResult.url;
        
        // [TEMP_IMAGE_CLEANUP #2] Clean up temp images after successful GitHub upload (Rename Page)
        const cleanedCount = cleanupTempImagesFromHtml(html_content || existingPage.html_content);
        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} temp images after GitHub rename`);
        }
      } catch (error) {
        console.error('GitHub rename failed:', error);
      }
    } else if (html_content) {
      // Just update content
      try {
        // If github_url exists, update at that specific path to preserve folder structure
        // Otherwise use uploadToGitHub which will create in current month's folder
        if (existingPage.github_url) {
          const githubResult = await updateFileAtPath(
            existingPage.github_url,
            html_content
          );
          githubUrl = githubResult.url;
        } else {
          const githubResult = await uploadToGitHub(
            existingPage.filename, 
            html_content
          );
          githubUrl = githubResult.url;
        }
        
        // [TEMP_IMAGE_CLEANUP #3] Clean up temp images after successful GitHub upload (Update Page Content)
        const cleanedCount = cleanupTempImagesFromHtml(html_content);
        if (cleanedCount > 0) {
          console.log(`Cleaned up ${cleanedCount} temp images after GitHub update`);
        }
      } catch (error) {
        console.error('GitHub update failed:', error);
      }
    }

    // Update database
    pageOperations.update.run({
      id: parseInt(id),
      title: title || existingPage.title,
      filename: filename || existingPage.filename,
      github_url: githubUrl,
      group_id: group_id !== undefined ? group_id : existingPage.group_id,
      sort_order: sort_order !== undefined ? sort_order : existingPage.sort_order,
      html_content: html_content || existingPage.html_content,
      sections_data: sections_data !== undefined ? (sections_data ? JSON.stringify(sections_data) : null) : existingPage.sections_data,
      preview_image: preview_image !== undefined ? preview_image : existingPage.preview_image
    });

    const updatedPage = pageOperations.getById.get(id);
    res.json(updatedPage);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update page by filename (for updating from editor)
app.put('/api/pages/by-filename/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { title, html_content, sections_data } = req.body;

    const existingPage = pageOperations.getByFilename.get(filename);
    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Update content in GitHub
    let githubUrl = existingPage.github_url;
    if (html_content) {
      try {
        // If github_url exists, update at that specific path to preserve folder structure
        // Otherwise use uploadToGitHub which will create in current month's folder
        if (existingPage.github_url) {
          const githubResult = await updateFileAtPath(
            existingPage.github_url,
            html_content
          );
          githubUrl = githubResult.url;
        } else {
          const githubResult = await uploadToGitHub(
            filename, 
            html_content
          );
          githubUrl = githubResult.url;
        }
        
        // Clean up temp images after successful GitHub upload
        const cleanedCount = cleanupTempImagesFromHtml(html_content);
        if (cleanedCount > 0) {
          console.log(`🗑️  Cleaned up ${cleanedCount} temp images after GitHub update (by filename)`);
        }
      } catch (error) {
        console.error('GitHub update failed:', error);
        // Continue with database update even if GitHub fails
      }
    }

    // Update database
    pageOperations.update.run({
      id: existingPage.id,
      title: title || existingPage.title,
      filename: existingPage.filename,
      github_url: githubUrl,
      group_id: existingPage.group_id,
      sort_order: existingPage.sort_order,
      html_content: html_content || existingPage.html_content,
      sections_data: sections_data !== undefined ? (sections_data ? JSON.stringify(sections_data) : null) : existingPage.sections_data,
      preview_image: existingPage.preview_image
    });

    const updatedPage = pageOperations.getById.get(existingPage.id);
    res.json(updatedPage);
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

// Delete page
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = pageOperations.getById.get(id);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete from GitHub - use github_url which contains the full path (e.g., "2025/10/filename.html")
    let githubDeleteSuccess = true;
    let githubDeleteError = null;
    
    if (page.github_url) {
      try {
        await deleteFromGitHub(page.github_url);
        console.log(`Deleted from GitHub: ${page.github_url}`);
      } catch (error) {
        console.error('GitHub delete failed:', error);
        githubDeleteSuccess = false;
        githubDeleteError = error.message;
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
});

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

app.post('/api/github/pull-all', async (req, res) => {
  try {
    console.log('🔄 Starting pull-all request...');
    
    // NOTE: Groups sync is now handled separately via the Smart Sync button
    // We don't pull groups here to reduce GitHub API calls and Actions triggers
    
    const result = await pullAllFromGitHub();
    
    if (!result.success) {
      console.error('Pull failed:', result.message);
      return res.json(result);
    }
    
    if (result.files.length === 0) {
      console.log('No files found');
      return res.json(result);
    }
    
    console.log(`Saving ${result.files.length} files to database...`);
    
    // Clear all existing pages and reset ID counter
    console.log('Clearing all existing pages...');
    const deleteResult = pageOperations.deleteAll.run();
    console.log(`Deleted ${deleteResult.changes} existing pages`);
    
    // Reset AUTOINCREMENT counter so IDs start from 1
    pageOperations.resetAutoIncrement.run();
    console.log('Reset ID counter - new pages will start from ID 1');
    
    // Save each file to database
    const savedFiles = [];
    const errors = [];
    
    for (const file of result.files) {
      try {
        // Use filename without extension as title (more reliable than HTML <title> tag)
        const title = file.name.replace('.html', '');
        
        // DEBUG: Check content before saving
        console.log(`Processing ${file.name}: content length = ${file.content ? file.content.length : 'NULL'} chars, size = ${file.size} bytes`);
        
        if (!file.content || file.content.length === 0) {
          console.error(`Skipping ${file.name}: content is empty or null`);
          errors.push({
            file: file.name,
            error: 'Content is empty or null'
          });
          continue;
        }
        
        // Since we cleared all pages, just create new ones
        // Sort order is based on the order from GitHub
        const sortOrder = savedFiles.length + 1;
        
        // Create new page
        const insertResult = pageOperations.create.run({
          title: title,
          filename: file.name,
          github_url: file.path, // Use file.path consistently (e.g., "2025/10/test.html")
          group_id: null, // No group assigned for pulled files
          sort_order: sortOrder,
          html_content: file.content,
          sections_data: null,
          preview_image: null
        });
        
        // DEBUG: Verify the page was saved correctly
        const savedPage = pageOperations.getById.get(insertResult.lastInsertRowid);
        const savedContentLength = savedPage.html_content ? savedPage.html_content.length : 0;
        
        if (savedContentLength === 0) {
          console.error(`WARNING: Page ${file.name} was saved but html_content is empty! Original content length: ${file.content.length}`);
        } else {
          console.log(`Created new page: ${file.name} with ID: ${insertResult.lastInsertRowid} (${file.size} bytes, ${savedContentLength} chars saved)`);
        }
        
        savedFiles.push({
          name: file.name,
          title: title,
          url: file.path, // Use file.path consistently
          size: file.size
        });
        
      } catch (error) {
        console.error(`Failed to save file ${file.name}:`, error);
        errors.push({
          file: file.name,
          error: error.message
        });
      }
    }
    
    console.log(`Successfully saved ${savedFiles.length}/${result.files.length} files`);
    
    // No need to clean up empty pages since we cleared everything at the start
    
    // Build response message
    let message = `Successfully pulled and saved ${savedFiles.length} files from GitHub`;
    if (result.failedCount > 0) {
      message += ` (${result.failedCount} files failed to fetch)`;
    }
    if (errors.length > 0) {
      message += ` (${errors.length} files failed to save)`;
    }
    
    // Return success response with saved files info
    res.json({
      success: true,
      message: message,
      files: savedFiles,
      fileTitles: savedFiles.map(f => f.title),
      pullErrors: result.errors,
      saveErrors: errors.length > 0 ? errors : undefined,
      stats: {
        total: result.files.length,
        saved: savedFiles.length,
        failed: errors.length,
        fetchFailed: result.failedCount || 0
      }
    });
    
  } catch (error) {
    console.error('GitHub pull all error:', error);
    res.status(500).json({ 
      error: 'Failed to pull all files from GitHub',
      details: error.message 
    });
  }
});

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

// ============ TEMP IMAGES API ============

/**
 * [TEMP_IMAGE_CLEANUP HELPER] Clean up temp images that are referenced in HTML content
 * Used by cleanup mechanisms #1, #2, #3
 * 
 * Extracts all local:// URLs and deletes them from temp_images table
 * @param {string} htmlContent - HTML content to scan for temp images
 * @returns {number} - Number of temp images cleaned up
 * 
 * Note: This function ONLY cleans up images that are referenced in the HTML.
 * Images that were uploaded but not used will NOT be cleaned by this function.
 */
function cleanupTempImagesFromHtml(htmlContent) {
  if (!htmlContent) return 0;
  
  // Match all local:// URLs in the HTML
  // Matches: local://uuid or http://localhost:3001/api/images/temp/uuid
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

// Save image to local database (for preview before publishing)
app.post('/api/images/temp/save', async (req, res) => {
  try {
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Image data and filename are required' });
    }

    // Generate unique image ID
    const imageId = crypto.randomUUID();
    
    // Extract mime type from data URL
    const mimeMatch = imageData.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Save to database
    tempImageOperations.save.run({
      image_id: imageId,
      filename: filename,
      image_data: imageData,
      mime_type: mimeType
    });
    
    console.log(`Saved temp image: ${imageId} (${filename})`);
    
    // Return HTTP URL that frontend can use to display the image
    res.json({
      success: true,
      imageId: imageId,
      localUrl: `http://localhost:${PORT}/api/images/temp/${imageId}`,
      filename: filename
    });
  } catch (error) {
    console.error('Failed to save temp image:', error);
    res.status(500).json({ 
      error: 'Failed to save image to local database',
      details: error.message 
    });
  }
});

// Get image from local database (returns actual image data for <img> tags)
app.get('/api/images/temp/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const image = tempImageOperations.getById.get(imageId);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Extract base64 data from data URL
    const base64Data = image.image_data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Set appropriate headers
    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the image buffer
    res.send(imageBuffer);
  } catch (error) {
    console.error('Failed to get temp image:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve image',
      details: error.message 
    });
  }
});

// Get all temp images
app.get('/api/images/temp', async (req, res) => {
  try {
    const images = tempImageOperations.getAll.all();
    
    res.json({
      success: true,
      count: images.length,
      images: images.map(img => ({
        imageId: img.image_id,
        filename: img.filename,
        mimeType: img.mime_type,
        createdAt: img.created_at,
        size: Math.round(img.image_data.length / 1024) // KB
      }))
    });
  } catch (error) {
    console.error('Failed to get temp images:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve images',
      details: error.message 
    });
  }
});

// Batch upload temp images to GitHub
// Check if image exists in GitHub before upload
app.post('/api/images/check-conflict', async (req, res) => {
  try {
    const { filename, customDate } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const result = await checkImageExists(filename, customDate ? new Date(customDate) : null);
    
    res.json({
      exists: result.exists,
      sha: result.sha,
      path: result.path,
      sanitizedFilename: result.sanitizedFilename
    });
  } catch (error) {
    console.error('❌ Check image conflict error:', error);
    res.status(500).json({ 
      error: 'Failed to check image conflict',
      details: error.message 
    });
  }
});

// Upload image to GitHub with conflict handling
app.post('/api/images/upload-to-github', async (req, res) => {
  try {
    const { imageData, filename, overwrite, existingSha } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Image data and filename are required' });
    }

    const uploadResult = await uploadImageToGitHub(
      imageData,
      filename,
      null, // customDate
      overwrite || false,
      existingSha || null
    );

    if (uploadResult.conflict) {
      // Return conflict information to frontend
      return res.status(409).json({
        conflict: true,
        exists: true,
        sha: uploadResult.sha,
        path: uploadResult.path,
        sanitizedFilename: uploadResult.sanitizedFilename,
        message: uploadResult.message
      });
    }

    if (uploadResult.success) {
      res.json({
        success: true,
        url: uploadResult.url,
        relativePath: uploadResult.relativePath,
        filename: uploadResult.filename
      });
    } else {
      res.status(500).json({
        success: false,
        error: uploadResult.message || 'Upload failed'
      });
    }
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image to GitHub',
      details: error.message 
    });
  }
});

app.post('/api/images/temp/upload-to-github', async (req, res) => {
  try {
    const { imageIds, conflictResolutions } = req.body;
    
    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({ error: 'imageIds array is required' });
    }

    const results = {
      success: [],
      failed: [],
      conflicts: []
    };

    for (const imageId of imageIds) {
      try {
        // Get image from database
        const image = tempImageOperations.getById.get(imageId);
        
        if (!image) {
          results.failed.push({
            imageId,
            error: 'Image not found in database'
          });
          continue;
        }

        // Check if there's a conflict resolution for this image
        const resolution = conflictResolutions?.[imageId];
        const overwrite = resolution?.action === 'overwrite';
        const newFilename = resolution?.action === 'rename' ? resolution.newFilename : image.filename;
        const existingSha = resolution?.sha;

        // Upload to GitHub
        const uploadResult = await uploadImageToGitHub(
          image.image_data,
          newFilename,
          null, // customDate
          overwrite,
          existingSha
        );

        if (uploadResult.conflict) {
          // File exists, need user decision
          results.conflicts.push({
            imageId,
            filename: image.filename,
            sanitizedFilename: uploadResult.sanitizedFilename,
            sha: uploadResult.sha,
            path: uploadResult.path,
            message: uploadResult.message
          });
        } else if (uploadResult.success) {
          results.success.push({
            imageId,
            localUrl: `local://${imageId}`,
            githubUrl: uploadResult.url,
            filename: uploadResult.filename
          });

          // [TEMP_IMAGE_CLEANUP #4] Delete from temp storage after successful batch upload to GitHub
          tempImageOperations.delete.run(imageId);
          console.log(`Uploaded and cleaned: ${imageId} -> ${uploadResult.url}`);
        } else {
          results.failed.push({
            imageId,
            error: uploadResult.message || 'Upload failed'
          });
        }
      } catch (error) {
        results.failed.push({
          imageId,
          error: error.message
        });
      }
    }

    console.log(`Batch upload complete: ${results.success.length} success, ${results.failed.length} failed, ${results.conflicts.length} conflicts`);

    res.json({
      success: results.conflicts.length === 0,
      uploaded: results.success.length,
      failed: results.failed.length,
      conflicts: results.conflicts.length,
      results: results
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images to GitHub',
      details: error.message 
    });
  }
});

// [TEMP_IMAGE_CLEANUP #5] Delete single temp image (Manual API)
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

// [TEMP_IMAGE_CLEANUP #6] Clear all temp images (Manual API)
app.delete('/api/images/temp', async (req, res) => {
  try {
    const result = tempImageOperations.deleteAll.run();
    
    console.log(`Cleared all temp images: ${result.changes} deleted`);
    
    res.json({
      success: true,
      deleted: result.changes,
      message: `Deleted ${result.changes} temp images`
    });
  } catch (error) {
    console.error('Failed to clear temp images:', error);
    res.status(500).json({ 
      error: 'Failed to clear images',
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

// ============ AUTO CLEANUP SCHEDULER ============

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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  
  // Initialize auto cleanup scheduler
  scheduleAutoCleanup();
  
  // Run cleanup once on server start to clean up from previous sessions
  console.log('\nRunning initial cleanup on server start...');
  const initialCleanup = cleanupOldTempImages();
  console.log(`Initial cleanup result:`, initialCleanup);
});

