/**
 * Custom Dialog Utility
 * Provides beautiful custom dialogs to replace native browser alerts and confirms
 */

let dialogInstance = null

/**
 * Register the dialog component instance
 * This should be called from App.vue after the CustomDialog component is mounted
 */
export function registerDialog(instance) {
  dialogInstance = instance
}

/**
 * Get the dialog instance
 */
function getDialogInstance() {
  if (!dialogInstance) {
    console.error('CustomDialog not registered. Make sure to register it in App.vue')
    return null
  }
  return dialogInstance
}

/**
 * Show a confirmation dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export async function confirm(message, options = {}) {
  const dialog = getDialogInstance()
  if (!dialog) {
    // Fallback to native confirm
    return window.confirm(message)
  }

  const result = await dialog.show({
    type: options.type || 'confirm',
    icon: options.icon,
    title: options.title || 'Confirm',
    message: message,
    confirmText: options.confirmText || 'OK',
    cancelText: options.cancelText || 'Cancel',
    showCancel: true
  })

  return result
}

/**
 * Show an alert dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function alert(message, options = {}) {
  const dialog = getDialogInstance()
  if (!dialog) {
    // Fallback to native alert
    window.alert(message)
    return
  }

  await dialog.show({
    type: options.type || 'alert',
    icon: options.icon,
    title: options.title || 'Notice',
    message: message,
    confirmText: options.confirmText || 'OK',
    showCancel: false
  })
}

/**
 * Show a warning dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export async function warning(message, options = {}) {
  return await confirm(message, {
    type: 'warning',
    icon: '!',
    title: options.title || 'Warning',
    confirmText: options.confirmText || 'Continue',
    cancelText: options.cancelText || 'Cancel',
    ...options
  })
}

/**
 * Show a danger/delete confirmation dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export async function danger(message, options = {}) {
  return await confirm(message, {
    type: 'danger',
    icon: 'X',
    title: options.title || 'Delete',
    confirmText: options.confirmText || 'Delete',
    cancelText: options.cancelText || 'Cancel',
    ...options
  })
}

/**
 * Show a success dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function success(message, options = {}) {
  await alert(message, {
    type: 'success',
    icon: '✓',
    title: options.title || 'Success',
    ...options
  })
}

/**
 * Show an error dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function error(message, options = {}) {
  await alert(message, {
    type: 'danger',
    icon: 'X',
    title: options.title || 'Error',
    ...options
  })
}

/**
 * Show an info dialog
 * @param {string} message - The message to display
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function info(message, options = {}) {
  await alert(message, {
    type: 'alert',
    icon: 'i',
    title: options.title || 'Information',
    ...options
  })
}

export default {
  registerDialog,
  confirm,
  alert,
  warning,
  danger,
  success,
  error,
  info
}

