/**
 * Pull All API Endpoint
 * Handles pulling all HTML files from GitHub repository
 * Downloads images from GitHub and converts GitHub links to local links
 */

import { pullAllFromGitHub, getFileFromGitHub } from '../github.js'
import { pageOperations, tempImageOperations } from '../database.js'
import { githubConfig } from '../config-store.js'
import crypto from 'crypto'

/**
 * Pull all pages from GitHub
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handlePullAll(req, res) {
  try {
    console.log('🔄 Starting pull-all request...')
    
    const result = await pullAllFromGitHub()
    
    if (!result.success) {
      console.error('Pull failed:', result.message)
      return res.json(result)
    }
    
    if (result.files.length === 0) {
      console.log('No files found')
      return res.json(result)
    }
    
    console.log(`Saving ${result.files.length} files to database...`)
    
    // Get all existing pages to compare
    const existingPages = pageOperations.getAll.all()
    
    // Create sets for quick lookup
    // Set of GitHub file paths (for pages with github_url - exact match)
    const githubFilePaths = new Set(
      result.files
        .filter(f => f.content && f.content.length > 0)
        .map(f => f.path)
    )
    
    // Set of GitHub filenames (for pages without github_url - match by filename)
    const githubFileNames = new Set(
      result.files
        .filter(f => f.content && f.content.length > 0)
        .map(f => f.name)
    )
    
    // Helper function to normalize github_url for comparison
    // Handles both relative paths and full URLs
    function normalizeGitHubUrl(url) {
      if (!url) return null
      // If it's a full URL, extract the relative path
      // Pattern: https://owner.github.io/repo/path or http://...
      const urlMatch = url.match(/https?:\/\/[^\/]+\/[^\/]+\/(.+)/)
      if (urlMatch) {
        return urlMatch[1]
      }
      // Otherwise, assume it's already a relative path
      return url
    }
    
    console.log(`📊 GitHub file paths (${githubFilePaths.size}):`, Array.from(githubFilePaths).slice(0, 5))
    console.log(`📊 Existing pages with github_url:`, existingPages.filter(p => p.github_url).map(p => ({ title: p.title, github_url: p.github_url })))
    
    // Note: We no longer delete local pages that don't exist in GitHub
    // Local pages are preserved even if they don't exist in GitHub
    
    // Helper function to download image from GitHub and save to local database
    async function downloadImageFromGitHub(githubImageUrl) {
      try {
        const config = githubConfig.getConfig()
        if (!config) {
          throw new Error('GitHub is not configured')
        }

        const { Octokit } = await import('octokit')
        const octokit = new Octokit({ auth: config.token })
        const { owner, repo, branch } = config

        // Extract relative path from GitHub URL
        // Pattern: https://owner.github.io/repo/YYYY/MM/images/filename
        // or: https://raw.githubusercontent.com/owner/repo/branch/YYYY/MM/images/filename
        let relativePath = githubImageUrl
        const urlMatch = githubImageUrl.match(/https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\/(.+)/)
        if (urlMatch) {
          relativePath = urlMatch[1]
        } else {
          // Try to extract from github.io URL
          const githubIoMatch = githubImageUrl.match(/https?:\/\/[^\/]+\.github\.io\/[^\/]+\/(.+)/)
          if (githubIoMatch) {
            relativePath = githubIoMatch[1]
          }
        }

        // Get file from GitHub API (raw base64 content)
        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: relativePath,
          ref: branch
        })

        // Get raw base64 content (don't decode)
        const base64Content = data.content.replace(/\n/g, '')
        
        // Determine MIME type from filename
        const filename = relativePath.split('/').pop() || 'image.png'
        let mimeType = 'image/png'
        const ext = filename.split('.').pop()?.toLowerCase()
        const mimeTypes = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml'
        }
        if (ext && mimeTypes[ext]) {
          mimeType = mimeTypes[ext]
        }

        // Convert to data URL
        const imageData = `data:${mimeType};base64,${base64Content}`

        // Generate image ID
        const imageId = crypto.randomUUID()

        // Save to local database
        tempImageOperations.save.run({
          image_id: imageId,
          filename: filename,
          image_data: imageData,
          mime_type: mimeType
        })

        console.log(`  ✓ Downloaded image: ${filename} → local://${imageId.substring(0, 8)}...`)

        return {
          imageId,
          localUrl: `local://${imageId}`,
          localhostUrl: `http://localhost:3001/api/images/temp/${imageId}`
        }
      } catch (error) {
        console.error(`  ✗ Failed to download image ${githubImageUrl}:`, error.message)
        return null
      }
    }

    // Helper function to convert GitHub image URLs to local URLs in HTML
    async function convertGitHubImagesToLocal(htmlContent) {
      // Pattern to match GitHub image URLs
      // Matches: https://owner.github.io/repo/YYYY/MM/images/filename
      // or: https://raw.githubusercontent.com/owner/repo/branch/YYYY/MM/images/filename
      const githubImagePattern = /https?:\/\/[^\/]+\.(github\.io|githubusercontent\.com)\/[^"'\s]+\.(jpg|jpeg|png|gif|webp|svg)/gi
      
      const imageUrlMapping = {}
      const matches = htmlContent.matchAll(githubImagePattern)
      
      for (const match of matches) {
        const githubUrl = match[0]
        if (!imageUrlMapping[githubUrl]) {
          const imageInfo = await downloadImageFromGitHub(githubUrl)
          if (imageInfo) {
            imageUrlMapping[githubUrl] = imageInfo.localhostUrl
          }
        }
      }

      // Replace GitHub URLs with local URLs
      let convertedHtml = htmlContent
      for (const [githubUrl, localUrl] of Object.entries(imageUrlMapping)) {
        const escapedUrl = githubUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(escapedUrl, 'gi')
        convertedHtml = convertedHtml.replace(regex, localUrl)
      }

      return {
        convertedHtml,
        imagesDownloaded: Object.keys(imageUrlMapping).length
      }
    }

    // Save or update each file from GitHub
    const savedFiles = []
    const updatedFiles = []
    const errors = []
    let totalImagesDownloaded = 0
    
    for (const file of result.files) {
      try {
        if (!file.content || file.content.length === 0) {
          console.error(`Skipping ${file.name}: content is empty or null`)
          errors.push({
            file: file.name,
            error: 'Content is empty or null'
          })
          continue
        }
        
        // Convert GitHub image URLs to local URLs
        console.log(`📥 Processing ${file.name}...`)
        const { convertedHtml, imagesDownloaded } = await convertGitHubImagesToLocal(file.content)
        totalImagesDownloaded += imagesDownloaded
        
        // Find existing page by github_url or filename
        let existingPage = existingPages.find(p => p.github_url === file.path)
        if (!existingPage) {
          // Try to find by filename if no github_url match
          existingPage = existingPages.find(p => p.filename === file.name)
        }
        
        if (existingPage) {
          // Update existing page
          const title = file.name.replace('.html', '')
          
          pageOperations.update.run({
            id: existingPage.id,
            title: title,
            filename: file.name,
            github_url: file.path, // Ensure github_url is set
            group_id: existingPage.group_id, // Preserve group_id
            sort_order: existingPage.sort_order, // Preserve sort_order
            html_content: convertedHtml, // Use converted HTML with local image links
            sections_data: existingPage.sections_data, // Preserve sections_data
            preview_image: existingPage.preview_image, // Preserve preview_image
            last_uploaded_at: new Date().toISOString() // Set to current time since we just synced from GitHub
          })
          
          updatedFiles.push({
            name: file.name,
            title: title,
            url: file.path
          })
          
          console.log(`  ✓ Updated existing page: ${file.name} (ID: ${existingPage.id}, ${imagesDownloaded} images downloaded)`)
        } else {
          // Create new page
          const title = file.name.replace('.html', '')
          const allPages = pageOperations.getAll.all()
          const maxSortOrder = allPages.length > 0 
            ? Math.max(...allPages.map(p => p.sort_order || 0)) 
            : 0
          
          const insertResult = pageOperations.create.run({
            title: title,
            filename: file.name,
            github_url: file.path, // Set github_url for sync status
            group_id: null,
            sort_order: maxSortOrder + 1,
            html_content: convertedHtml, // Use converted HTML with local image links
            sections_data: null,
            preview_image: null
          })
          
          // Update last_uploaded_at since this page was pulled from GitHub (synced)
          const newPageId = insertResult.lastInsertRowid
          const newPage = pageOperations.getById.get(newPageId)
          if (newPage) {
            pageOperations.update.run({
              id: newPageId,
              title: newPage.title,
              filename: newPage.filename,
              github_url: newPage.github_url,
              group_id: newPage.group_id,
              sort_order: newPage.sort_order,
              html_content: newPage.html_content,
              sections_data: newPage.sections_data,
              preview_image: newPage.preview_image,
              last_uploaded_at: new Date().toISOString() // Set to current time since we just synced from GitHub
            })
          }
          
          savedFiles.push({
            name: file.name,
            title: title,
            url: file.path,
            size: file.size
          })
          
          console.log(`  ✓ Created new page: ${file.name} (ID: ${insertResult.lastInsertRowid}, ${imagesDownloaded} images downloaded)`)
        }
        
      } catch (error) {
        console.error(`Failed to save file ${file.name}:`, error)
        errors.push({
          file: file.name,
          error: error.message
        })
      }
    }
    
    console.log(`Successfully processed ${savedFiles.length + updatedFiles.length}/${result.files.length} files`)
    console.log(`  - Created: ${savedFiles.length}`)
    console.log(`  - Updated: ${updatedFiles.length}`)
    console.log(`  - Images downloaded: ${totalImagesDownloaded}`)
    
    // Build response message
    let message = `Successfully pulled ${savedFiles.length + updatedFiles.length} files from GitHub`
    if (savedFiles.length > 0) {
      message += ` (${savedFiles.length} created)`
    }
    if (updatedFiles.length > 0) {
      message += ` (${updatedFiles.length} updated)`
    }
    if (totalImagesDownloaded > 0) {
      message += `\n📥 Downloaded ${totalImagesDownloaded} images to local database`
    }
    if (result.failedCount > 0) {
      message += `\n⚠️  ${result.failedCount} files failed to fetch`
    }
    if (errors.length > 0) {
      message += `\n⚠️  ${errors.length} files failed to save`
    }
    
    // Return success response with saved files info
    res.json({
      success: true,
      message: message,
      files: [...savedFiles, ...updatedFiles],
      fileTitles: [...savedFiles, ...updatedFiles].map(f => f.title),
      pullErrors: result.errors,
      saveErrors: errors.length > 0 ? errors : undefined,
      stats: {
        total: result.files.length,
        saved: savedFiles.length,
        updated: updatedFiles.length,
        imagesDownloaded: totalImagesDownloaded,
        failed: errors.length,
        fetchFailed: result.failedCount || 0
      }
    })
    
  } catch (error) {
    console.error('GitHub pull all error:', error)
    res.status(500).json({ 
      error: 'Failed to pull all files from GitHub',
      details: error.message 
    })
  }
}

