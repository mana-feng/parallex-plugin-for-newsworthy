let inputModalInstance = null

export function setInputModalInstance(instance) {
  inputModalInstance = instance
}

export function getInputModalInstance() {
  if (!inputModalInstance) {
    console.warn('InputModal instance not set. Make sure to call setInputModalInstance() in App.vue')
  }
  return inputModalInstance
}

export function slugify(text) {
  if (!text) return ''
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function promptPageInfo(defaultTitle = '', defaultFilename = '') {
  const modal = getInputModalInstance()
  if (!modal) {
    throw new Error('InputModal not available')
  }

  try {
    const result = await modal.show({
      icon: '+',
      title: 'Save New Page',
      subtitle: 'Enter page title and filename',
      label: 'Page Title',
      placeholder: 'My Awesome Page',
      hint: 'Enter a descriptive title for your page',
      defaultValue: defaultTitle,
      confirmText: 'Save',
      cancelText: 'Cancel',
      required: true,
      showSecondaryInput: true,
      secondaryLabel: 'Filename',
      secondaryPlaceholder: 'my-awesome-page',
      secondaryHint: 'URL-friendly filename (auto-generated from title)',
      secondaryDefaultValue: defaultFilename || slugify(defaultTitle),
      secondaryRequired: true,
      autoSyncSecondary: true,
      syncTransform: slugify
    })

    if (result && result.primary && result.secondary) {
      return {
        title: result.primary,
        filename: result.secondary
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

export async function promptInput(options = {}) {
  const modal = getInputModalInstance()
  if (!modal) {
    throw new Error('InputModal not available')
  }

  try {
    const result = await modal.show({
      icon: '✎',
      title: 'Input Required',
      label: 'Value',
      placeholder: 'Enter value...',
      confirmText: 'OK',
      cancelText: 'Cancel',
      required: true,
      ...options
    })
    
    return result || null
  } catch (error) {
    return null
  }
}

export async function showCopyText(text, title = 'Copy Text') {
  const modal = getInputModalInstance()
  if (!modal) {
    throw new Error('InputModal not available')
  }

  try {
    await modal.show({
      icon: '⎘',
      title: title,
      label: 'Select and copy the text below',
      defaultValue: text,
      inputType: 'text',
      confirmText: 'Done',
      cancelText: null,
      required: false,
      readonly: true
    })
  } catch (error) {
  }
}
