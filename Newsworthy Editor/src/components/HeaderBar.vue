<template>
    <header class="header-bar">
        <div class="header-left">
            <button class="home-btn" @click="handleReturnHome" title="Return to initial empty page">
                ⌂ Home
            </button>
        </div>
        <h1 class="header-title">
            Immersive Long Form Multimedia Article Editor
            <span v-if="store.currentPageInfo.isLoaded" class="editing-indicator">
                (Editing: {{ store.currentPageInfo.title }})
            </span>
        </h1>
        <div class="actions">
            <button 
                v-if="store.currentPageInfo.isLoaded" 
                class="update-btn" 
                @click="handleUpdate"
                :disabled="store.sections.length === 0"
            >
                ⬆ Update
            </button>
            <button 
                class="save-btn" 
                @click="handleSaveNew"
                :disabled="store.sections.length === 0"
            >
                + Save New
            </button>
            <button class="preview-btn" @click="store.togglePreview">👁 Preview</button>
        </div>
    </header>
</template>

<script setup>
import { useEditorStore } from '@/stores/editorStore'
import * as dialog from '@/utils/dialog'

const store = useEditorStore()

const handleUpdate = async () => {
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
    
    try {
        const htmlContent = await store.exportToHTML()
        const sectionsData = await store.prepareSectionsForSave()
        const previewImage = await store.generatePreviewImage()
        
        const response = await fetch(`http://localhost:3001/api/pages/by-filename/${encodeURIComponent(store.currentPageInfo.filename)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: store.currentPageInfo.title,
                html_content: htmlContent,
                sections_data: sectionsData,
                preview_image: previewImage
            })
        })
        
        if (response.ok) {
            await dialog.success(`"${store.currentPageInfo.title}" has been updated.\n\nChanges saved to database and GitHub Pages.`, {
                title: 'Page Updated Successfully',
                icon: '✓'
            })
        } else {
            const error = await response.json()
            await dialog.error(error.error, {
                title: 'Failed to Update Page'
            })
        }
    } catch (error) {
        console.error('Update error:', error)
        await dialog.error('Please ensure the backend server is running.', {
            title: 'Failed to Update Page'
        })
    }
}

const handleSaveNew = () => {
    document.dispatchEvent(new CustomEvent('trigger-save-new'))
}

const handleReturnHome = async () => {
    await store.returnToHome()
}
</script>

<style scoped>
.header-bar {
    background-color: #c77a7a;
    color: #111;
    padding: 16px 24px;
    border-bottom: 1px solid #b86e6e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.header-left {
    display: flex;
    align-items: center;
    min-width: 120px;
}

.header-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-align: center;
    flex: 1;
    text-shadow: 1px 1px 0 #fff4;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.editing-indicator {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.85;
    font-style: italic;
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview-btn,
.save-btn,
.update-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.preview-btn {
    background: #8b4444;
}

.preview-btn:hover {
    background: #9c5151;
    transform: translateY(-1px);
}

.preview-btn:active {
    background: #7c3e3e;
    transform: translateY(0);
}

.save-btn {
    background: #059669;
}

.save-btn:hover:not(:disabled) {
    background: #10b981;
    transform: translateY(-1px);
}

.save-btn:active:not(:disabled) {
    background: #047857;
    transform: translateY(0);
}

.update-btn {
    background: #2563eb;
}

.update-btn:hover:not(:disabled) {
    background: #3b82f6;
    transform: translateY(-1px);
}

.update-btn:active:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(0);
}

.save-btn:disabled,
.update-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    opacity: 0.6;
}

.home-btn {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: #6b7280;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
}

.home-btn:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

.home-btn:active {
    background: #374151;
    transform: translateY(0);
}
</style>