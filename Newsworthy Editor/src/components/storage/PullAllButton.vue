<template>
  <button @click="handlePullAllFromGitHub" class="btn btn-pull" :disabled="!props.githubConnected">
    ⬇️ Pull All from GitHub
  </button>
</template>

<script setup>
import { ref } from 'vue'
import * as dialog from '@/utils/dialog'
import { pullAllFromGitHub, getPages, updatePage } from '@/services/apiService'

const props = defineProps({
  githubConnected: {
    type: Boolean,
    required: true
  },
  onSuccess: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits(['success'])

const generatePreviewFromHtml = async (htmlContent) => {
  try {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.width = '1200px'
    iframe.style.height = '800px'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    iframe.contentDocument.open()
    iframe.contentDocument.write(htmlContent)
    iframe.contentDocument.close()

    await new Promise(resolve => setTimeout(resolve, 1000))

    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(iframe.contentDocument.body, {
      backgroundColor: '#ffffff',
      scale: 0.3,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: 1200,
      height: 800
    })

    document.body.removeChild(iframe)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
    return dataUrl
  } catch (error) {
    console.error('Error generating preview from HTML:', error)
    return null
  }
}

const generateThumbnailsForPages = async (pageIds, pages) => {
  let successCount = 0
  let errorCount = 0

  for (const pageId of pageIds) {
    try {
      const page = pages.find(p => p.id === pageId)
      if (!page || !page.html_content) continue

      const previewImage = await generatePreviewFromHtml(page.html_content)
      
      if (previewImage) {
        const result = await updatePage(pageId, {
          title: page.title,
          filename: page.filename,
          html_content: page.html_content,
          sections_data: page.sections_data,
          group_id: page.group_id,
          sort_order: page.sort_order,
          preview_image: previewImage
        })

        if (result.ok) {
          successCount++
        } else {
          errorCount++
        }
      }
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageId}:`, error)
      errorCount++
    }
  }

  return { successCount, errorCount }
}

const handlePullAllFromGitHub = async () => {
  if (!props.githubConnected) {
    await dialog.warning('Please configure your GitHub Pages settings first.', {
      title: 'GitHub Pages Not Configured',
      icon: '⚠️'
    })
    return
  }

  const confirmed = await dialog.confirm(
    'Pull all pages from GitHub?\n\nThis will download all HTML files from your GitHub repository and save them to the local database.\n\nExisting pages will be updated with the latest content from GitHub.',
    {
      title: 'Pull All Pages',
      icon: '📥',
      confirmText: 'Pull All',
      cancelText: 'Cancel'
    }
  )
  if (!confirmed) {
    return
  }

  try {
    const pullResult = await pullAllFromGitHub()
    
    if (!pullResult.ok) {
      await dialog.error(pullResult.error || 'Unknown error', {
        title: 'Pull Failed'
      })
      return
    }
    
    const pullData = pullResult.data
    
    if (!pullData.success) {
      await dialog.error(pullData.message || 'Unable to download pages from GitHub.', {
        title: 'Pull Failed'
      })
      return
    }
    
    if (pullData.files.length === 0) {
      await dialog.info('No HTML files were found in your GitHub repository.', {
        title: 'No Pages Found',
        icon: 'ℹ️'
      })
      return
    }
    
    const pagesResult = await getPages()
    const pages = pagesResult.ok ? pagesResult.data : []
    
    const pagesNeedingThumbnails = pages
      .filter(p => !p.preview_image && p.html_content)
      .map(p => p.id)
    
    let thumbnailMessage = ''
    if (pagesNeedingThumbnails.length > 0) {
      try {
        const { successCount, errorCount } = await generateThumbnailsForPages(pagesNeedingThumbnails, pages)
        thumbnailMessage = `\n\n🖼️ Thumbnails: Generated ${successCount} thumbnails`
        if (errorCount > 0) {
          thumbnailMessage += ` (${errorCount} failed)`
        }
      } catch (error) {
        console.error('Failed to auto-generate thumbnails:', error)
        thumbnailMessage = `\n\n⚠️ Failed to auto-generate thumbnails`
      }
    }
    
    let message = `✅ Successfully pulled ${pullData.files.length} files from GitHub!\n\n`
    
    if (pullData.stats) {
      message += `📊 Statistics:\n`
      message += `   Total files: ${pullData.stats.total}\n`
      message += `   Saved: ${pullData.stats.saved}\n`
      if (pullData.stats.fetchFailed > 0) {
        message += `   Failed to fetch: ${pullData.stats.fetchFailed}\n`
      }
      if (pullData.stats.failed > 0) {
        message += `   Failed to save: ${pullData.stats.failed}\n`
      }
      if (pullData.stats.cleaned > 0) {
        message += `   🧹 Cleaned up: ${pullData.stats.cleaned} empty pages\n`
      }
      message += `\n`
    }
    
    if (pullData.fileTitles && pullData.fileTitles.length > 0) {
      const displayFiles = pullData.fileTitles.slice(0, 10)
      message += `📄 Files: ${displayFiles.join(', ')}`
      if (pullData.fileTitles.length > 10) {
        message += `, ... and ${pullData.fileTitles.length - 10} more`
      }
    }
    
    message += thumbnailMessage
    
    await dialog.success(message, {
      title: `Successfully Pulled ${pullData.files.length} Pages!`,
      icon: '📥'
    })
    
    // Force a delay to ensure database is updated before reloading
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (props.onSuccess) {
      props.onSuccess()
    }
    emit('success')
    
  } catch (error) {
    console.error('Pull all from GitHub error:', error)
    await dialog.error(error.message || 'Unable to download pages from GitHub. Please try again.', {
      title: 'Pull Failed'
    })
  }
}
</script>

<style scoped>
.btn {
  width: auto;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.btn:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #d0d0d0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #999;
}

.btn-pull {
  background: #d4e8f1;
  border: 1px solid #b8d0e8;
  color: #1e3a5e;
}

.btn-pull:hover:not(:disabled) {
  background: #c0d8e8;
}

.btn-pull:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}
</style>

