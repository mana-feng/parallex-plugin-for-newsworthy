// API service for backend endpoints

const API_PORT = 3001

export const API_BASE_URL = `http://localhost:${API_PORT}/api`;

/**
 * Build API URL
 */
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export { API_PORT }

/**
 * Fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = apiUrl(endpoint)
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json()
      
      if (!response.ok) {
        return {
          ok: false,
          error: data.error || data.message || 'Request failed',
          data: null,
          response
        }
      }
      
      return {
        ok: true,
        data,
        response
      }
    }
    
    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        data: null,
        response
      }
    }
    
    return {
      ok: true,
      data: await response.text(),
      response
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Network error',
      data: null,
      response: null
    }
  }
}

/**
 * Save temporary image
 */
export async function saveTempImage(imageData, filename, imageId = null) {
  const body = { imageData, filename }
  if (imageId) {
    body.imageId = imageId
  }
  return request('/images/temp/save', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * Validate image IDs
 */
export async function validateImageIds(imageIds) {
  return request('/images/temp/validate', {
    method: 'POST',
    body: JSON.stringify({ imageIds })
  })
}

/**
 * Check if image exists in GitHub (conflict check)
 */
export async function checkImageConflict(filename, customDate = null) {
  const body = { filename }
  if (customDate) {
    body.customDate = customDate
  }
  
  return request('/images/check-conflict', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * Upload images to GitHub
 */
export async function uploadImagesToGitHub(imageIds, conflictResolutions = null) {
  const body = { imageIds }
  if (conflictResolutions) {
    body.conflictResolutions = conflictResolutions
  }
  
  return request('/images/temp/upload-to-github', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
/**
 * Get all pages
 */
export async function getPages(filters = {}) {
  const params = new URLSearchParams()
  if (filters.group_id) params.append('group_id', filters.group_id)
  if (filters.search) params.append('search', filters.search)
  
  const query = params.toString()
  const endpoint = query ? `/pages?${query}` : '/pages'
  
  return request(endpoint)
}

/**
 * Get page by ID
 */
export async function getPage(id) {
  return request(`/pages/${id}`)
}

/**
 * Create page
 */
export async function createPage(pageData) {
  return request('/pages', {
    method: 'POST',
    body: JSON.stringify(pageData)
  })
}

/**
 * Update page by ID
 */
export async function updatePage(id, pageData) {
  return request(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pageData)
  })
}

/**
 * Update page by filename
 */
export async function updatePageByFilename(filename, pageData) {
  return request(`/pages/by-filename/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    body: JSON.stringify(pageData)
  })
}

/**
 * Upload page to GitHub
 */
export async function uploadPageToGitHub(id) {
  return request(`/pages/${id}/upload`, {
    method: 'POST'
  })
}

/**
 * Delete page
 */
export async function deletePage(id) {
  return request(`/pages/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Reorder pages
 */
export async function reorderPages(pageIds) {
  return request('/pages/reorder', {
    method: 'POST',
    body: JSON.stringify({ pageIds })
  })
}

/**
 * Get all groups
 */
export async function getGroups() {
  return request('/groups')
}

/**
 * Create group
 */
export async function createGroup(groupData) {
  return request('/groups', {
    method: 'POST',
    body: JSON.stringify(groupData)
  })
}

/**
 * Update group
 */
export async function updateGroup(id, groupData) {
  return request(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(groupData)
  })
}

/**
 * Delete group
 */
export async function deleteGroup(id) {
  return request(`/groups/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Sync groups to GitHub
 */
export async function syncGroupsPush() {
  return request('/groups/sync/push', {
    method: 'POST'
  })
}

/**
 * Sync groups from GitHub
 */
export async function syncGroupsPull() {
  return request('/groups/sync/pull', {
    method: 'POST'
  })
}

/**
 * Smart sync groups
 */
export async function syncGroupsSmart() {
  return request('/groups/sync/smart', {
    method: 'POST'
  })
}

/**
 * Get GitHub status
 */
export async function getGitHubStatus() {
  return request('/github/status')
}

/**
 * Pull all from GitHub
 */
export async function pullAllFromGitHub() {
  return request('/github/pull-all', {
    method: 'POST'
  })
}

/**
 * Get GitHub settings
 */
export async function getGitHubSettings() {
  return request('/settings/github')
}

/**
 * Save GitHub settings
 */
export async function saveGitHubSettings(settings) {
  return request('/settings/github', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
}

/**
 * Test GitHub connection
 */
export async function testGitHubConnection(settings) {
  return request('/settings/github/test', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
}

export { request }
