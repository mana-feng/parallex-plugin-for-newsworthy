<template>
  <button 
    class="nw-btn nw-btn-accent update-btn" 
    @click="handleClick"
    :disabled="disabled || isUpdating"
  >
    <span class="nw-icon">{{ isUpdating ? '⏳' : '⬆' }}</span>
    <span>{{ isUpdating ? 'Updating...' : 'Update' }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import * as dialog from '@/utils/dialog'
import { updatePageByFilename } from '@/services/apiService'
import { usePageSave } from '@/composables/usePageSave'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['updated', 'error'])

const store = useEditorStore()
const isUpdating = ref(false)
const { validateAndReuploadImages } = usePageSave()

const handleClick = async () => {
  if (isUpdating.value) return
  
  if (!store.currentPageInfo.isLoaded) {
    await dialog.warning('No page is currently loaded for editing.', {
      title: 'No Page Loaded',
      icon: '!'
    })
    return
  }
  
  if (store.sections.length === 0) {
    await dialog.warning('Please add content before updating.\n\nAdd at least one section to your page.', {
      title: 'No Content',
      icon: '!'
    })
    return
  }
  
  const confirmed = await dialog.confirm(
    `Update page "${store.currentPageInfo.title}"?\n\nThis will overwrite the existing page with your current edits.\n\nFilename: ${store.currentPageInfo.filename}\n\nContinue?`,
    {
      title: 'Update Page',
      icon: '✎',
      confirmText: 'Update',
      cancelText: 'Cancel'
    }
  )
  
  if (!confirmed) return
  
  isUpdating.value = true

  try {
    // Step 1: Collect all local image IDs
    const localImageIds = store.collectLocalImageIds()

    // Step 2: Validate images are in local database (no GitHub upload)
    if (localImageIds.length > 0) {
      const validationResult = await validateAndReuploadImages(localImageIds)
      if (!validationResult.success) {
        if (validationResult.cancelled) {
          isUpdating.value = false
          return
        }
      }
    }

    // Step 3: Generate HTML and update page to local database only
    const htmlContent = await store.exportToHTML()
    const sectionsData = await store.prepareSectionsForSave()
    const previewImage = await store.generatePreviewImage()
    
    const result = await updatePageByFilename(store.currentPageInfo.filename, {
      title: store.currentPageInfo.title,
      html_content: htmlContent,
      sections_data: sectionsData,
      preview_image: previewImage
    })
    
    if (result.ok) {
      // Emit custom event to notify StorageManager to refresh
      window.dispatchEvent(new CustomEvent('page-updated', { 
        detail: { page: result.data } 
      }))
      
      await dialog.success(`"${store.currentPageInfo.title}" has been updated.\n\nChanges saved to your local database.\n\nYou can upload it to GitHub later from the Storage Manager.`, {
        title: 'Page Updated Successfully!',
        icon: '✅'
      })
      emit('updated', result.data)
    } else {
      await dialog.error(result.error || 'An unexpected error occurred. Please try again.', {
        title: 'Failed to Update Page'
      })
      emit('error', result.error)
    }
  } catch (error) {
    console.error('Update error:', error)
    await dialog.error('Unable to reach the server.\n\nPlease ensure the backend is running and try again.', {
      title: 'Connection Error'
    })
    emit('error', error)
  } finally {
    isUpdating.value = false
  }
}
</script>

<style scoped>
.update-btn {
  /* Additional styles for update button if needed */
}
</style>

