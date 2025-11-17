import { Octokit } from 'octokit';
import { githubConfig } from './config-store.js';

/**
 * Get Octokit instance with current configuration
 * @returns {Octokit|null}
 */
function getOctokit() {
  const config = githubConfig.getConfig();
  if (!config || !config.token) {
    return null;
  }
  return new Octokit({ auth: config.token });
}

/**
 * Get current GitHub configuration
 * @returns {Object|null}
 */
function getConfig() {
  return githubConfig.getConfig();
}

/**
 * Upload HTML file to GitHub repository
 * @param {string} filename - Name of the HTML file
 * @param {string} content - HTML content
 * @param {Date} customDate - Optional custom date for folder structure (defaults to now)
 * @returns {Promise<string>} - GitHub Pages URL
 */
export async function uploadToGitHub(filename, content, customDate = null) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch, baseUrl } = config;

  try {
    // Ensure filename ends with .html
    if (!filename.endsWith('.html')) {
      filename += '.html';
    }

    // Sanitize filename
    filename = filename.replace(/[^a-zA-Z0-9-_.]/g, '-');

    // Generate date-based folder structure: YYYY/MM/
    const date = customDate || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const datePath = `${year}/${month}`;
    
    // Construct full path with date folders
    const path = `${datePath}/${filename}`;
    
    // Check if file already exists
    let sha = null;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      sha = data.sha;
    } catch (error) {
      // File doesn't exist, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: sha ? `Update ${filename}` : `Add ${filename}`,
      content: Buffer.from(content).toString('base64'),
      branch,
      ...(sha && { sha })
    });

    // Return relative path instead of full URL
    return {
      url: path,  // Store relative path (e.g., "2025/10/filename.html")
      commit: response.data.commit.sha,
      filename: path  // Return full path including date folders
    };
  } catch (error) {
    console.error('GitHub upload error:', error);
    throw new Error(`Failed to upload to GitHub: ${error.message}`);
  }
}

/**
 * Update file at a specific path in GitHub repository
 * @param {string} filePath - Full path to the file (e.g., "2025/10/article.html")
 * @param {string} content - New content
 * @returns {Promise<Object>} - Update result
 */
export async function updateFileAtPath(filePath, content) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;

  try {
    // Get current file SHA
    let sha = null;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch
      });
      sha = data.sha;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`File not found at path: ${filePath}`);
      }
      throw error;
    }

    // Update file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `Update ${filePath}`,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha
    });

    return {
      url: filePath,
      commit: response.data.commit.sha,
      filename: filePath
    };
  } catch (error) {
    console.error('GitHub update error:', error);
    throw new Error(`Failed to update file at path ${filePath}: ${error.message}`);
  }
}

/**
 * Delete file from GitHub repository
 * @param {string} filename - Name of the file to delete (can include path)
 * @returns {Promise<void>}
 */
export async function deleteFromGitHub(filename) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;

  try {
    // Get file SHA
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filename,
      ref: branch
    });

    // Delete file
    await octokit.rest.repos.deleteFile({
      owner,
      repo,
      path: filename,
      message: `Delete ${filename}`,
      sha: data.sha,
      branch
    });

    return { success: true };
  } catch (error) {
    console.error('GitHub delete error:', error);
    throw new Error(`Failed to delete from GitHub: ${error.message}`);
  }
}

/**
 * Recursively get all HTML files from a directory
 * @param {Octokit} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @param {string} path - Current path
 * @returns {Promise<Array>} - Array of file paths
 */
async function getFilesRecursively(octokit, owner, repo, branch, path = '') {
  const files = [];
  
  try {
    console.log(`Checking path: ${path}`);
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    // Handle single file case
    if (!Array.isArray(data)) {
      if (data.name.endsWith('.html')) {
        files.push(data);
      }
      return files;
    }

    console.log(`Found ${data.length} items in ${path}`);

    // Process each item in directory
    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.html')) {
        console.log(`Found HTML file: ${item.path}`);
        files.push(item);
      } else if (item.type === 'dir') {
        console.log(`Found directory: ${item.path}, recursing...`);
        // Recursively get files from subdirectory
        const subFiles = await getFilesRecursively(octokit, owner, repo, branch, item.path);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error reading path ${path}:`, error.message);
  }

  return files;
}

/**
 * List all HTML files in the repository (recursively)
 * @returns {Promise<Array>} - Array of file objects
 */
export async function listGitHubFiles() {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch, baseUrl } = config;

  try {
    const files = await getFilesRecursively(octokit, owner, repo, branch, '');

    return files.map(file => ({
      name: file.name,
      path: file.path,  // Full path including folders
      url: `${baseUrl}/${file.path}`,
      size: file.size,
      sha: file.sha
    }));
  } catch (error) {
    console.error('GitHub list error:', error);
    throw new Error(`Failed to list GitHub files: ${error.message}`);
  }
}

/**
 * Rename file in GitHub repository
 * @param {string} oldFilename - Current filename (can include path)
 * @param {string} newFilename - New filename (without path)
 * @param {string} content - File content
 * @param {Date} customDate - Optional custom date for folder structure
 * @returns {Promise<Object>}
 */
export async function renameInGitHub(oldFilename, newFilename, content, customDate = null) {
  try {
    // Upload with new name (will use current date or provided date for path)
    const uploadResult = await uploadToGitHub(newFilename, content, customDate);
    
    // Delete old file (oldFilename might include path like "2024/10/file.html")
    await deleteFromGitHub(oldFilename);
    
    return uploadResult;
  } catch (error) {
    console.error('GitHub rename error:', error);
    throw new Error(`Failed to rename in GitHub: ${error.message}`);
  }
}

/**
 * Check if GitHub configuration is valid
 * @returns {Promise<boolean>}
 */
export async function validateGitHubConfig() {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    return false;
  }

  const { owner, repo } = config;

  try {
    // Try to get repo info
    await octokit.rest.repos.get({
      owner,
      repo
    });

    return true;
  } catch (error) {
    console.error('GitHub validation error:', error);
    return false;
  }
}

/**
 * Test GitHub configuration with provided credentials
 * @param {Object} testConfig - Configuration to test
 * @returns {Promise<Object>}
 */
export async function testGitHubConfig(testConfig) {
  try {
    const { token, owner, repo } = testConfig;
    
    if (!token || !owner || !repo) {
      return { success: false, error: 'Missing required configuration' };
    }

    const testOctokit = new Octokit({ auth: token });
    
    // Try to get repo info
    await testOctokit.rest.repos.get({
      owner,
      repo
    });

    return { success: true };
  } catch (error) {
    console.error('GitHub test error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to GitHub'
    };
  }
}

/**
 * Get content of a specific file from GitHub
 * @param {string} filePath - Path to the file in the repository
 * @returns {Promise<Object>} - File content and metadata
 */
export async function getFileFromGitHub(filePath) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch, baseUrl } = config;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    
    return {
      content,
      path: data.path,
      name: data.name,
      size: data.size,
      sha: data.sha,
      url: `${baseUrl}/${data.path}`
    };
  } catch (error) {
    console.error('GitHub get file error:', error);
    throw new Error(`Failed to get file from GitHub: ${error.message}`);
  }
}

/**
 * Sync content with GitHub - compare local and remote versions
 * @param {string} filePath - Path to the file in the repository
 * @param {string} localContent - Local content to compare
 * @returns {Promise<Object>} - Sync status and actions needed
 */
export async function syncWithGitHub(filePath, localContent) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;

  try {
    // Get remote content
    let remoteContent = null;
    let remoteSha = null;
    
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branch
      });
      remoteContent = Buffer.from(data.content, 'base64').toString('utf-8');
      remoteSha = data.sha;
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist remotely
        remoteContent = null;
      } else {
        throw error;
      }
    }

    // Compare content
    const isLocalNewer = localContent !== remoteContent;
    const isRemoteNewer = remoteContent && remoteContent !== localContent;
    const needsSync = isLocalNewer || isRemoteNewer;

    return {
      needsSync,
      isLocalNewer,
      isRemoteNewer,
      remoteContent,
      remoteSha,
      localContent,
      actions: {
        upload: isLocalNewer,
        download: isRemoteNewer,
        conflict: isLocalNewer && isRemoteNewer
      }
    };
  } catch (error) {
    console.error('GitHub sync error:', error);
    throw new Error(`Failed to sync with GitHub: ${error.message}`);
  }
}

/**
 * Get all HTML files from GitHub with their content (with batching to avoid API limits)
 * @returns {Promise<Array>} - Array of file objects with content
 */
export async function getAllFilesFromGitHub() {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch, baseUrl } = config;

  try {
    const files = await getFilesRecursively(octokit, owner, repo, branch, '');
    console.log(`Found ${files.length} HTML files, fetching content in batches`);
    
    // Process files in batches to avoid overwhelming the API
    const BATCH_SIZE = 5;
    const filesWithContent = [];
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (${batch.length} files)`);
      
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            // Add retry logic for failed requests
            let retries = 3;
            let lastError = null;
            
            while (retries > 0) {
              try {
                const { data } = await octokit.rest.repos.getContent({
                  owner,
                  repo,
                  path: file.path,
                  ref: branch
                });
                
                // Check if content is too large (warning only, no limit)
                if (data.size > 1000000) { // 1MB
                  console.warn(`File ${file.path} is large (${data.size} bytes, ${(data.size / 1024 / 1024).toFixed(2)} MB)`);
                }
                
                // Decode base64 content
                let content;
                try {
                  content = Buffer.from(data.content, 'base64').toString('utf-8');
                  
                  // Verify content was decoded successfully
                  if (!content || content.length === 0) {
                    console.error(`Content is empty after decoding for ${file.path}`);
                    throw new Error('Content is empty after decoding');
                  }
                  
                  console.log(`Decoded ${file.path}: ${content.length} characters`);
                } catch (decodeError) {
                  console.error(`Failed to decode content for ${file.path}:`, decodeError.message);
                  throw decodeError;
                }
                
                console.log(`Fetched ${file.path} (${data.size} bytes)`);
                
                return {
                  name: file.name,
                  path: file.path,
                  url: file.path, // Store relative path instead of absolute URL
                  size: file.size,
                  sha: file.sha,
                  content
                };
              } catch (error) {
                lastError = error;
                retries--;
                if (retries > 0) {
                  console.log(`Retry ${3 - retries}/3 for ${file.path}`);
                  // Wait a bit before retrying
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }
            
            // All retries failed
            throw lastError;
            
          } catch (error) {
            console.error(`Failed to get content for ${file.path}:`, error.message);
            return {
              name: file.name,
              path: file.path,
              url: file.path,
              size: file.size,
              sha: file.sha,
              content: null,
              error: error.message
            };
          }
        })
      );
      
      filesWithContent.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = filesWithContent.filter(f => f.content !== null).length;
    console.log(`Successfully fetched ${successCount}/${files.length} files`);

    return filesWithContent;
  } catch (error) {
    console.error('GitHub get all files error:', error);
    throw new Error(`Failed to get all files from GitHub: ${error.message}`);
  }
}

/**
 * Pull all HTML files from GitHub (without combining content to avoid memory issues)
 * @returns {Promise<Object>} - Files array and metadata
 */
export async function pullAllFromGitHub() {
  try {
    console.log('Starting pullAllFromGitHub');
    
    // First check if GitHub is configured
    const config = getConfig();
    if (!config) {
      throw new Error('GitHub is not configured');
    }
    
    console.log('GitHub config found:', { owner: config.owner, repo: config.repo, branch: config.branch });
    
    const files = await getAllFilesFromGitHub();
    console.log(`Retrieved ${files.length} files from GitHub`);
    
    if (files.length === 0) {
      return {
        success: true,
        message: 'No HTML files found in GitHub repository',
        files: []
      };
    }

    // Filter out files with errors
    const validFiles = files.filter(file => file.content !== null);
    const failedFiles = files.filter(file => file.content === null);
    
    console.log(`Valid files: ${validFiles.length}`);
    if (failedFiles.length > 0) {
      console.warn(`Failed to fetch ${failedFiles.length} files:`, failedFiles.map(f => f.path));
    }
    
    if (validFiles.length === 0) {
      return {
        success: false,
        message: 'No valid HTML files could be loaded',
        files: files,
        errors: failedFiles.map(f => ({ file: f.path, error: f.error }))
      };
    }

    // Extract file titles
    const fileTitles = validFiles.map(file => file.name.replace('.html', ''));

    return {
      success: true,
      message: `Successfully pulled ${validFiles.length} HTML files`,
      files: validFiles,
      fileTitles: fileTitles,
      failedCount: failedFiles.length,
      errors: failedFiles.length > 0 ? failedFiles.map(f => ({ file: f.path, error: f.error })) : undefined
    };

  } catch (error) {
    console.error('GitHub pull all error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.data
    });
    throw new Error(`Failed to pull all files from GitHub: ${error.message}`);
  }
}

/**
 * Check if an image file exists in GitHub repository
 * @param {string} filename - Image filename
 * @param {Date} customDate - Optional custom date for folder structure (defaults to now)
 * @returns {Promise<Object>} - Object with exists flag and sha if exists
 */
export async function checkImageExists(filename, customDate = null) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;

  try {
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, '-');
    
    // Generate date-based folder structure: YYYY/MM/images/
    const date = customDate || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const imagePath = `${year}/${month}/images/${sanitizedFilename}`;
    
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: imagePath,
        ref: branch
      });
      
      return {
        exists: true,
        sha: data.sha,
        path: imagePath,
        sanitizedFilename
      };
    } catch (error) {
      if (error.status === 404) {
        return {
          exists: false,
          path: imagePath,
          sanitizedFilename
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('GitHub check image error:', error);
    throw new Error(`Failed to check image in GitHub: ${error.message}`);
  }
}

/**
 * Upload image to GitHub repository in YYYY/MM/images/ folder
 * @param {string} imageData - Base64 image data or data URL
 * @param {string} filename - Image filename
 * @param {Date} customDate - Optional custom date for folder structure (defaults to now)
 * @param {boolean} overwrite - Whether to overwrite if file exists (defaults to false)
 * @param {string} existingSha - SHA of existing file (required if overwrite is true)
 * @returns {Promise<Object>} - Upload result with GitHub URL
 */
export async function uploadImageToGitHub(imageData, filename, customDate = null, overwrite = false, existingSha = null) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch, baseUrl } = config;

  try {
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, '-');
    
    // Generate date-based folder structure: YYYY/MM/images/
    const date = customDate || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const imagePath = `${year}/${month}/images/${sanitizedFilename}`;
    
    // Convert data URL to base64 if needed
    let base64Content = imageData;
    if (imageData.startsWith('data:')) {
      // Extract base64 part from data URL
      const base64Match = imageData.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (base64Match) {
        base64Content = base64Match[1];
      }
    } else if (imageData.startsWith('blob:')) {
      throw new Error('Blob URLs must be converted to base64 before upload');
    }
    
    // Check if file already exists
    let sha = existingSha;
    if (!sha) {
      try {
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: imagePath,
          ref: branch
        });
        sha = data.sha;
        
        // If file exists and we're not overwriting, return conflict error
        if (!overwrite) {
          return {
            success: false,
            conflict: true,
            exists: true,
            sha: sha,
            path: imagePath,
            sanitizedFilename: sanitizedFilename,
            message: 'File already exists. Please choose to rename or overwrite.'
          };
        }
      } catch (error) {
        // File doesn't exist, which is fine
        if (error.status !== 404) {
          throw error;
        }
      }
    }

    // Create or update file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: imagePath,
      message: sha ? `Update ${sanitizedFilename}` : `Add ${sanitizedFilename}`,
      content: base64Content,
      branch,
      ...(sha && { sha })
    });

    // Return GitHub Pages URL and relative path
    return {
      success: true,
      url: `${baseUrl}/${imagePath}`,
      relativePath: imagePath,
      commit: response.data.commit.sha,
      filename: sanitizedFilename
    };
  } catch (error) {
    console.error('GitHub image upload error:', error);
    throw new Error(`Failed to upload image to GitHub: ${error.message}`);
  }
}

/**
 * Upload groups.json to GitHub repository
 * @param {string} jsonContent - JSON content of groups
 * @returns {Promise<Object>} - Upload result
 */
export async function uploadGroupsJson(jsonContent) {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;
  const path = 'groups.json';

  try {
    // Check if file already exists
    let sha = null;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });
      sha = data.sha;
    } catch (error) {
      // File doesn't exist, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: sha ? 'Update groups.json' : 'Add groups.json',
      content: Buffer.from(jsonContent).toString('base64'),
      branch,
      ...(sha && { sha })
    });

    console.log('Groups JSON uploaded to GitHub');

    return {
      success: true,
      path,
      sha: response.data.content.sha,
      commit: response.data.commit.sha
    };
  } catch (error) {
    console.error('GitHub upload groups JSON error:', error);
    throw new Error(`Failed to upload groups.json to GitHub: ${error.message}`);
  }
}

/**
 * Download groups.json from GitHub repository
 * @returns {Promise<Object>} - Groups JSON data
 */
export async function downloadGroupsJson() {
  const octokit = getOctokit();
  const config = getConfig();
  
  if (!octokit || !config) {
    throw new Error('GitHub is not configured. Please configure GitHub settings first.');
  }

  const { owner, repo, branch } = config;
  const path = 'groups.json';

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const jsonData = JSON.parse(content);

    console.log('Groups JSON downloaded from GitHub');

    return {
      success: true,
      data: jsonData,
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 404) {
      // File doesn't exist yet
      console.log('groups.json not found in GitHub repository');
      return {
        success: false,
        notFound: true,
        message: 'groups.json not found in repository'
      };
    }
    console.error('GitHub download groups JSON error:', error);
    throw new Error(`Failed to download groups.json from GitHub: ${error.message}`);
  }
}

