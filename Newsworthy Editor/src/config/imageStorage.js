/**
 * Image storage configuration
 * Uses localhost backend server (localhost:3001)
 * URL format: local://{id}
 */

export const STORAGE_METHOD = 'localhost'

/**
 * Get image save function
 */
export async function getSaveTempImageFunction() {
  const { saveTempImage } = await import('@/services/apiService')
  return saveTempImage
}

/**
 * Get image validation function
 */
export async function getValidateImageIdsFunction() {
  const { validateImageIds } = await import('@/services/apiService')
  return validateImageIds
}

