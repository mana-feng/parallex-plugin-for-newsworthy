<!-- eslint-disable no-unused-vars -->
<template>
  <aside class="sidebar">
    <div class="side-title">Editor Tools</div>

    <div class="btns">
      <AddSectionButton @add="$emit('add-section')" />
      <AddTextBlockButton :disabled="!store.currSection" />
      <AddImageBlockButton :disabled="!store.currSection" @add-image="handleAddImage" />
      <AddVideoBlockButton :disabled="!store.currSection" />
      <AddParallaxButton @add="$emit('add-parallax')" />
          <button class="nw-sidebar-btn nw-sidebar-btn-secondary" @click="$emit('open-storage')">
        <span class="btn-icon">📁</span>
        <span>Storage Manager</span>
      </button>
      <button class="nw-sidebar-btn nw-sidebar-btn-ghost" @click="$emit('open-settings')">
        <span class="btn-icon">⚙️</span>
        <span>Settings</span>
      </button>
    </div>

    <div v-if="showImageModal" class="modal-overlay" @click.self="closeImageModal">
      <div class="modal-container image-modal">
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon" style="animation: none;">🖼️</div>
            <div>
              <h3>Add Image Block</h3>
              <p class="modal-subtitle">Choose an image type and upload or provide a URL</p>
            </div>
          </div>
          <button class="modal-close" @click="closeImageModal">×</button>
        </div>
        <div class="modal-body">
          <div class="image-type-section">
            <label class="modal-label">Image Type</label>
            <div class="image-type-tabs">
              <button class="type-tab-btn" :class="{ active: imageType === 'normal' }" @click="imageType = 'normal'">
                🖼️ Normal
              </button>
              <button class="type-tab-btn" :class="{ active: imageType === 'fullwidth' }"
                @click="imageType = 'fullwidth'">
                🌄 Full Width
              </button>
              <button class="type-tab-btn" :class="{ active: imageType === 'float' }" @click="imageType = 'float'">
                📝 Float & Text
              </button>
            </div>
            <div class="type-description">
              <p v-if="imageType === 'normal'">Standard image block with caption</p>
              <p v-if="imageType === 'fullwidth'">Full-width image that spans the entire section</p>
              <p v-if="imageType === 'float'">Image with text wrapping around it</p>
            </div>
          </div>

          <div class="image-source-tabs">
            <button class="tab-btn" :class="{ active: imageSourceTab === 'url' }" @click="imageSourceTab = 'url'">
              🔗 URL
            </button>
            <button class="tab-btn" :class="{ active: imageSourceTab === 'upload' }" @click="imageSourceTab = 'upload'">
              📤 Upload
            </button>
          </div>

          <div v-if="imageSourceTab === 'url'" class="tab-content">
            <div class="form-section">
              <label class="modal-label">
                <span class="label-icon">🔗</span>
                Image URL
              </label>
              <input type="text" v-model="imageUrl" class="modal-input" placeholder="https://example.com/image.jpg"
                @keyup.enter="confirmAddImage" ref="imageUrlInput" />
            </div>

            <div class="url-format-info-section">
              <div class="url-format-info-header">
                <span class="url-format-info-icon">💡</span>
                <span class="url-format-info-title">Supported Formats</span>
              </div>
              <div class="url-format-list">
                <div class="url-format-item">
                  <span class="url-format-icon">📷</span>
                  <div class="url-format-details">
                    <div class="url-format-title">JPEG Images</div>
                    <div class="url-format-example">https://example.com/photo.jpg</div>
                  </div>
                </div>
                <div class="url-format-item">
                  <span class="url-format-icon">🖼️</span>
                  <div class="url-format-details">
                    <div class="url-format-title">PNG Images</div>
                    <div class="url-format-example">https://example.com/image.png</div>
                  </div>
                </div>
                <div class="url-format-item">
                  <span class="url-format-icon">🎨</span>
                  <div class="url-format-details">
                    <div class="url-format-title">Other Formats</div>
                    <div class="url-format-example">GIF, WebP, SVG also supported</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="imageSourceTab === 'upload'" class="tab-content">
            <label class="modal-label">
              <span class="label-icon">📁</span>
              Choose Image File
            </label>
            <div class="upload-area" :class="{ 'drag-over': isDraggingOver }" @click="triggerFileInput"
              @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
              <div v-if="!selectedImageFile" class="upload-placeholder">
                <div class="upload-icon">📁</div>
                <p class="upload-text">Click to select an image</p>
                <p class="upload-subtext">or drag and drop here</p>
              </div>
              <div v-else class="upload-preview">
                <img :src="imagePreviewUrl" alt="Preview" class="preview-image" />
                <p class="file-name">{{ selectedImageFile.name }}</p>
                <button class="change-file-btn" @click.stop="triggerFileInput">Change File</button>
              </div>
            </div>
            <input type="file" ref="imageFileInput" accept="image/*" style="display: none" @change="handleFileSelect" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancel" @click="closeImageModal">
            <span class="btn-icon">✕</span>
            Cancel
          </button>
          <button class="modal-btn modal-btn-confirm" @click="confirmAddImage">
            <span class="btn-icon">✓</span>
            Add Image
          </button>
        </div>
      </div>
    </div>

    <!-- Conflict Resolution Modal -->
    <!-- Image Conflict Resolution Modal -->
    <div v-if="showConflictModal" class="modal-overlay" @click.self="cancelConflictResolutions">
      <div class="modal-container conflict-modal">
        <div class="modal-header">
          <div class="conflict-header-content">
            <div class="conflict-icon">⚠️</div>
            <div>
              <h3>Image File Conflicts Detected</h3>
              <p class="modal-subtitle">
                {{ conflictImages.length }} image{{ conflictImages.length > 1 ? 's' : '' }} already exist{{
                  conflictImages.length === 1 ? 's' : '' }} in GitHub.
                Choose how to handle each conflict:
              </p>
            </div>
          </div>
          <button class="modal-close" @click="cancelConflictResolutions">×</button>
        </div>

        <div class="modal-body conflict-list">
          <div v-for="(conflict, index) in conflictImages" :key="conflict.imageId" class="conflict-item">
            <div class="conflict-item-header">
              <div class="conflict-number">{{ index + 1 }}</div>
              <div class="conflict-info">
                <div class="conflict-filename">
                  <span class="file-icon">📄</span>
                  <span class="filename-text">{{ conflict.filename }}</span>
                </div>
                <div class="conflict-path">{{ conflict.path }}</div>
              </div>
            </div>

            <div class="conflict-actions">
              <div class="action-option">
                <label class="conflict-action-label"
                  :class="{ 'active': conflictResolutions[conflict.imageId]?.action === 'overwrite' }">
                  <input type="radio" :name="`conflict-${conflict.imageId}`" value="overwrite"
                    :checked="conflictResolutions[conflict.imageId]?.action === 'overwrite'"
                    @change="updateConflictResolution(conflict.imageId, 'overwrite')" />
                  <div class="action-content">
                    <div class="action-icon overwrite-icon">🔄</div>
                    <div class="action-text">
                      <span class="action-title">Overwrite existing file</span>
                      <span class="action-description">Replace the file on GitHub with this new version</span>
                    </div>
                  </div>
                </label>
              </div>

              <div class="action-option">
                <label class="conflict-action-label"
                  :class="{ 'active': conflictResolutions[conflict.imageId]?.action === 'rename' }">
                  <input type="radio" :name="`conflict-${conflict.imageId}`" value="rename"
                    :checked="conflictResolutions[conflict.imageId]?.action === 'rename'"
                    @change="updateConflictResolution(conflict.imageId, 'rename', conflict.filename)" />
                  <div class="action-content">
                    <div class="action-icon rename-icon">✏️</div>
                    <div class="action-text">
                      <span class="action-title">Rename and upload as new file</span>
                      <span class="action-description">Keep both files by using a different name</span>
                    </div>
                  </div>
                </label>

                <div v-if="conflictResolutions[conflict.imageId]?.action === 'rename'" class="rename-input-container">
                  <input type="text" class="rename-input modal-input"
                    :value="conflictResolutions[conflict.imageId]?.newFilename"
                    @input="updateConflictResolution(conflict.imageId, 'rename', $event.target.value)"
                    placeholder="Enter new filename (e.g., image-v2.png)" />
                  <span class="input-hint">Tip: Add a suffix like -v2, -new, or timestamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-info">
            <span class="info-icon">ℹ️</span>
            <span class="info-text">All conflicts must be resolved before continuing</span>
          </div>
          <div class="footer-actions">
            <button class="modal-btn modal-btn-cancel" @click="cancelConflictResolutions">
              Cancel Upload
            </button>
            <button class="modal-btn modal-btn-confirm" @click="confirmConflictResolutions"
              :disabled="!allConflictsResolved">
              Continue Upload ({{ resolvedCount }}/{{ conflictImages.length }})
            </button>
          </div>
        </div>
      </div>
    </div>

    
  </aside>
</template>


<script setup>
import { computed, ref, nextTick, watch } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import ImageSettingsPanel from "@/components/ImageSettingsPanel.vue"
import * as dialog from '@/utils/dialog'
import { promptInput } from '@/utils/inputModal'
import AddSectionButton from './add/AddSectionButton.vue'
import AddTextBlockButton from './add/AddTextBlockButton.vue'
import AddImageBlockButton from './add/AddImageBlockButton.vue'
import AddVideoBlockButton from './add/AddVideoBlockButton.vue'
import AddParallaxButton from './add/AddParallaxButton.vue'
import '@/styles/urlFormatInfo.css'

const store = useEditorStore()
const curr = computed(() => store.currSection)
const textColor = ref('#000000')

function setHeading(level) {
  store.activeEditor?.chain().focus().setHeading({ level }).run()
}

function setParagraph() {
  store.activeEditor?.chain().focus().setParagraph().updateAttributes('paragraph', { lineHeight: '1.5' }).run()
}

function toggleBold() {
  store.activeEditor?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  store.activeEditor?.chain().focus().toggleItalic().run()
}

function setFontSize(size) {
  const ed = store.activeEditor
  if (!ed) return
  const chain = ed.chain().focus()
  if (size) {
    chain.setMark('textStyle', { fontSize: size }).run()
  } else {
    chain.updateAttributes('textStyle', { fontSize: null })
      .removeEmptyTextStyle()
      .run()
  }
}

const currentFontSize = ref('')

watch(
  () => store.activeEditor,
  (ed) => {
    if (!ed) return

    ed.off?.('selectionUpdate')

    ed.on('selectionUpdate', ({ editor }) => {
      const size = editor.getAttributes('textStyle').fontSize
      currentFontSize.value = size || ''
    })
  },
  { immediate: true }
)


function parseSizeToPx(size, parentPx = 16) {
  if (!size) return null

  // number → assume px
  if (typeof size === 'number') return size

  // "20px"
  if (size.endsWith('px')) {
    return parseFloat(size)
  }

  // "1.5em"
  if (size.endsWith('em')) {
    return parseFloat(size) * parentPx
  }

  // "120%"
  if (size.endsWith('%')) {
    return parentPx * (parseFloat(size) / 100)
  }

  // assume px
  const v = parseFloat(size)
  return isNaN(v) ? parentPx : v
}


function getFontSizeFromMarks(ed) {
  const attrs = ed.getAttributes('textStyle')
  return attrs?.fontSize || 16
}

function isDropCapActive() {
  const ed = store.activeEditor
  if (!ed) return false
  const { $from } = ed.state.selection
  const start = $from.start()
  ed.chain().setTextSelection({ from: start, to: start + 1 }).run()
  const a = ed.getAttributes('textStyle')
  return a?.float === 'left' && a?.display === 'inline-block'
}

function toggleDropCap() {
  const ed = store.activeEditor
  if (!ed) return

  const { $from } = ed.state.selection
  const start = $from.start()
  const firstChar = ed.state.doc.textBetween(start, start + 1)
  if (!firstChar) return
  ed.chain().focus().setTextSelection({ from: start, to: start + 1 }).run()

  const chain = ed.chain().focus()
  if (isDropCapActive()) {
    chain.updateAttributes('textStyle', {
      float: null,
      display: null,
      fontSize: null,
      lineHeight: null,
      marginRight: null,
      marginTop: null,
      fontWeight: null,
    }).removeEmptyTextStyle().run()
  } else {
    const pEl =
      (function () {
        let node = ed.view.domAtPos($from.pos).node
        if (node?.nodeType === 3) node = node.parentElement
        return node?.closest('p') || node
      })() || ed.view.dom

    const cs = getComputedStyle(pEl)
    const markSize = getFontSizeFromMarks(ed)
    const parentFs = parseFloat(cs.fontSize) || 16
    const f_p = parseSizeToPx(markSize, parentFs) ?? parentFs
    const lh_px = cs.lineHeight === 'normal'
      ? 1.0 * f_p
      : parseFloat(cs.lineHeight) || (1.5 * f_p)
    const LINES = 2
    const MIN_DROP_SCALE = 1.6
    let sizePx = LINES * lh_px
    sizePx = Math.max(sizePx, f_p * MIN_DROP_SCALE)

    if (f_p < 16) {
      sizePx = 32
    }

    console.log({ f_p, lh_px, sizePx })

    chain.setMark('textStyle', {
      float: 'left',
      display: 'inline-block',
      fontSize: `${sizePx}px`,
      lineHeight: '1.5',
      marginRight: '0.25em',
      marginTop: '0em',
      fontWeight: '700',
    }).run()
  }
}

const currentWidthDisplay = computed(() => {
  const w = store.currBlock?.props?.width
  return w ? String(w) : '65ch'
})

const textWidthValueCh = computed(() => {
  const w = store.currBlock?.props?.width
  if (!w) return 65
  const m = String(w).trim().match(/^(\d+(?:\.\d+)?)(ch|px)$/i)
  if (!m) return 65
  const num = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit === 'ch') return Math.round(num)
  return Math.round(num / 8)
})

function onWidthSlider(v) {
  const n = Number(v)
  if (!isFinite(n)) return
  store.setTextBlockWidth(n, 'ch')
}

function onWidthNumber(v) {
  const n = Number(v)
  if (!isFinite(n)) return
  store.setTextBlockWidth(n, 'ch')
}

function setAlign(align) {
  store.activeEditor?.chain().focus().setTextAlign(align).run()
}

function isActiveAlign(align) {
  return !!store.activeEditor?.isActive({ textAlign: align })
}

function applyColor() {
  if (store.activeEditor) {
    store.activeEditor
      .chain()
      .focus()
      .setColor(textColor.value)
      .run()
  }
}

function setFontFamily(family) {
  const ed = store.activeEditor
  if (!ed) return
  const chain = ed.chain().focus()
  if (family) {
    chain.setMark('textStyle', { fontFamily: family }).run()
  } else {
    chain.updateAttributes('textStyle', { fontFamily: null })
      .removeEmptyTextStyle()
      .run()
  }
}

async function setLink() {
  const url = await promptInput({
    title: 'Add Link',
    subtitle: 'Enter the URL for this link',
    label: 'URL',
    placeholder: 'https://example.com',
    icon: '🔗',
    inputType: 'url',
    hint: 'Enter the full URL including http:// or https://',
    confirmText: 'Add Link'
  })
  if (!url) return
  store.activeEditor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function unsetLink() {
  store.activeEditor?.chain().focus().unsetLink().run()
}

function replaceImage() {
  const imgPicker = document.createElement('input')
  imgPicker.type = 'file'
  imgPicker.accept = 'image/*'
  imgPicker.onchange = e => {
    const file = e.target.files?.[0]
    if (!file) return

    const blk = store.currBlock
    if (!blk) return

    if (blk.type !== 'image' && blk.type !== 'fullwidth-image' && blk.type !== 'float-image') {
      return
    }

    if (blk.type === 'image' && blk._blobUrl && blk._blobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(blk._blobUrl)
      } catch (err) {
        console.warn('Failed to revoke old blob URL:', err)
      }
    }

    const url = URL.createObjectURL(file)

    const img = new Image()
    img.onload = () => {
      const naturalW = img.naturalWidth || 300
      const naturalH = img.naturalHeight || 300
      const ratio = naturalW / naturalH || 1

      if (blk.type === 'image') {
        const idx = store.selected.imageIndex ?? 0
        if (Array.isArray(blk.images) && blk.images[idx]) {
          blk.images[idx].src = url
          blk.images[idx]._blobUrl = url
          blk.images[idx].aspectRatio = ratio
          if (blk.images[idx].keepRatio && blk.images[idx].width) {
            blk.images[idx].height = Math.round(blk.images[idx].width / ratio)
          }
        } else {
          blk.src = url
          blk._blobUrl = url
          blk.aspectRatio = ratio
          if (blk.keepRatio && blk.width) {
            blk.height = Math.round(blk.width / ratio)
          }
        }
      } else if (blk.type === 'fullwidth-image') {
        blk.image.src = url
        blk.image.aspectRatio = ratio
      } else if (blk.type === 'float-image') {
        blk.image.src = url
        blk.image.aspectRatio = ratio
      }
    }

    img.onerror = async () => {
      URL.revokeObjectURL(url)
      await dialog.error('Failed to load image. Please try another file.', {
        title: 'Image Load Error'
      })
    }

    img.src = url
  }
  imgPicker.click()
}

const bgColorProxy = computed({
  get: () => curr.value?.props?.background ?? '#ffffff',
  set: (val) => store.setSecBg(val)
})

// Video modal logic moved to AddVideoBlockButton component

const showImageModal = ref(false)
const imageType = ref('normal')
const imageSourceTab = ref('url')
const imageUrl = ref('')
const imageUrlInput = ref(null)
const imageFileInput = ref(null)
const selectedImageFile = ref(null)
const imagePreviewUrl = ref('')
const isDraggingOver = ref(false)

// Conflict resolution modal state
const showConflictModal = ref(false)
const conflictImages = ref([])
const conflictResolutions = ref({})
const conflictResolveCallback = ref(null)

// Computed properties for conflict resolution UI
const resolvedCount = computed(() => {
  return Object.keys(conflictResolutions.value).filter(imageId => {
    const resolution = conflictResolutions.value[imageId]
    if (!resolution) return false
    if (resolution.action === 'overwrite') return true
    if (resolution.action === 'rename' && resolution.newFilename && resolution.newFilename.trim()) {
      return true
    }
    return false
  }).length
})

const allConflictsResolved = computed(() => {
  if (conflictImages.value.length === 0) return false
  return resolvedCount.value === conflictImages.value.length
})

const updateConflictResolution = (imageId, action, newFilename = null) => {
  const conflict = conflictImages.value.find(c => c.imageId === imageId)
  if (!conflict) return

  conflictResolutions.value[imageId] = {
    action: action,
    newFilename: action === 'rename' ? (newFilename || conflict.filename) : conflict.filename,
    sha: conflict.sha
  }
}

const confirmConflictResolutions = () => {
  if (conflictResolveCallback.value) {
    conflictResolveCallback.value(conflictResolutions.value)
  }
  showConflictModal.value = false
  conflictResolveCallback.value = null
}

const cancelConflictResolutions = () => {
  if (conflictResolveCallback.value) {
    conflictResolveCallback.value(null)
  }
  showConflictModal.value = false
  conflictResolveCallback.value = null
}

const handleAddImage = () => {
  showImageModal.value = true
  imageType.value = 'normal'
  imageSourceTab.value = 'url'
  imageUrl.value = ''
  selectedImageFile.value = null
  imagePreviewUrl.value = ''
  isDraggingOver.value = false
  nextTick(() => {
    if (imageSourceTab.value === 'url') imageUrlInput.value?.focus()
  })
}

const closeImageModal = () => {
  showImageModal.value = false
  imageUrl.value = ''
  selectedImageFile.value = null
  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = ''
}

const triggerFileInput = () => {
  imageFileInput.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  processImageFile(file)
}

const processImageFile = async (file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    await dialog.warning('Please select an image file.\n\nOnly image files are supported.', {
      title: 'Invalid File Type',
      icon: '⚠️'
    })
    return
  }

  // Clean up old blob URL
  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  selectedImageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

// eslint-disable-next-line no-unused-vars
const handleDragEnter = (e) => {
  isDraggingOver.value = true
}

// eslint-disable-next-line no-unused-vars
const handleDragOver = (e) => {
  isDraggingOver.value = true
}

const handleDragLeave = (e) => {
  // Only set to false if we're leaving the upload area itself
  if (e.target.classList.contains('upload-area')) {
    isDraggingOver.value = false
  }
}

const handleDrop = (e) => {
  isDraggingOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  processImageFile(file)
}

const confirmAddImage = async () => {
  if (imageSourceTab.value === 'url') {
    const url = imageUrl.value.trim()
    if (!url) {
      await dialog.warning('Please enter a valid image URL.\n\nThe URL must start with http:// or https://', {
        title: 'URL Required',
        icon: '⚠️'
      })
      return
    }
    // Use service function for URL-based images
    const { addImageFromUrl } = await import('@/services/imageBlockService')
    const context = {
      sections: store.sections,
      currSection: computed(() => store.currSection),
      currBlock: computed(() => store.currBlock),
      selected: store.selected
    }
    await addImageFromUrl(url, imageType.value, context)
    closeImageModal()
  } else if (imageSourceTab.value === 'upload') {
    if (!selectedImageFile.value) {
      await dialog.warning('Please select an image file.\n\nChoose an image to upload.', {
        title: 'No File Selected',
        icon: '⚠️'
      })
      return
    }

    // Use service function for file upload
    const { processImageUpload } = await import('@/services/imageBlockService')
    const context = {
      sections: store.sections,
      currSection: computed(() => store.currSection),
      currBlock: computed(() => store.currBlock),
      selected: store.selected
    }

    await processImageUpload(
      selectedImageFile.value,
      imageType.value,
      context,
      () => closeImageModal(), // onSuccess
      () => { } // onError - error already handled in service
    )
  }
}

function onWidthChange(newWidth) {
  store.setVideoWidth(Number(newWidth))

  // if keep ratio = true, auto update height
  if (store.currBlock?.keepRatio) {
    const height = Math.round(newWidth * 9 / 16)
    store.setVideoHeight(height)
  }
}

function onToggleRatio(checked) {
  store.setVideoKeepRatio(checked)

  if (checked) {
    // strong sync to 16:9 immediately
    const w = store.currBlock.width
    store.setVideoHeight(Math.round(w * 9 / 16))
  }
}

// Save functionality moved to SaveButton component in header/

</script>

<style scoped>
/* Sidebar layout */
.sidebar {
  height: 100%;
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: linear-gradient(180deg, var(--nw-neutral-50) 0%, var(--nw-surface) 100%);
  border-right: 1px solid var(--nw-neutral-200);
  box-shadow: inset -6px 0 12px rgba(26, 35, 50, 0.03);
}

.side-title {
  margin: 0 0 16px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: var(--nw-primary);
  font-family: var(--nw-font-secondary);
}

.side-title::after {
  content: '';
  display: block;
  width: 56px;
  height: 3px;
  background: var(--nw-accent);
  border-radius: var(--nw-radius-full);
  margin: 8px auto 0;
}

/* Top area button */
.btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.btn:hover:not(:disabled) {
  background-color: #f8f9fa;
  border-color: #d0d0d0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  background-color: #f0f0f0;
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #999;
}

/* Parallax Button */
.btn-parallax {
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border-color: #ffe4b3;
  color: #b8860b;
}

.btn-parallax:hover:not(:disabled) {
  background: linear-gradient(135deg, #fff5e6 0%, #ffefd5 100%);
  border-color: #ffd699;
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.15);
}



/* Detail buttons */


/* Segmented buttons */
.nw-segmented-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-sm);
  overflow: hidden;
  background: var(--nw-surface);
}

.nw-segment {
  min-width: 40px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: all .15s ease;
  color: var(--nw-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nw-segment+.nw-segment {
  border-left: 1px solid var(--nw-border);
}

.nw-segment:hover {
  background: var(--nw-surface-hover);
  color: var(--nw-text-primary);
}

.nw-segment.active {
  background: var(--nw-primary);
  color: white;
  font-weight: 600;
}

.segment-icon {
  font-size: 14px;
  line-height: 1;
}

/* Text block delete */
.delete-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 16px;
}

.delete-btn.small {
  padding: 6px 16px;
  border: 1px solid var(--nw-accent-red);
  border-radius: var(--nw-radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--nw-accent-red);
  transition: all .15s ease;
}

.delete-btn.small:hover {
  background: rgba(239, 68, 68, 0.1);
}

.delete-btn.small:active {
  transform: scale(0.98);
}

:deep(.ProseMirror) {
  display: block;
  overflow: visible;
}

:deep(.prose p) {
  margin: 0 0 1em !important;
  clear: none !important;
  line-height: 1.6;
}

:deep(.ProseMirror p) {
  margin: 0 0 1em;
  clear: none;
  line-height: 1.6;
}

/* ===== Modal Base Styles ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.modal-container {
  background: var(--nw-surface);
  border-radius: var(--nw-radius-xl);
  box-shadow: var(--nw-shadow-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--nw-border);
}

@keyframes slideUp {
  from {
    transform: translateY(30px) scale(0.95);
    opacity: 0;
  }

  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid var(--nw-border);
  background: var(--nw-surface);
  gap: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--nw-text-primary);
  font-family: var(--nw-font-secondary);
}

.modal-subtitle {
  margin: 8px 0 0 0;
  font-size: 15px;
  font-weight: normal;
  color: var(--nw-text-secondary);
  line-height: 1.5;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--nw-radius-sm);
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: var(--nw-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--nw-hover);
  color: var(--nw-text-primary);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid var(--nw-border);
  background: var(--nw-surface);
}

.modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--nw-radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--nw-font-body);
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.modal-btn-cancel {
  background: var(--nw-surface);
  border: 1px solid var(--nw-border);
  color: var(--nw-text-secondary);
}

.modal-btn-cancel:hover {
  background: var(--nw-surface-hover);
  border-color: var(--nw-primary);
  color: var(--nw-text-primary);
}

.modal-btn-confirm {
  background: var(--nw-primary);
  color: white;
  box-shadow: var(--nw-shadow-sm);
}

.modal-btn-confirm:hover:not(:disabled) {
  background: var(--nw-primary-dark);
  box-shadow: var(--nw-shadow-md);
  transform: translateY(-1px);
}

.modal-btn-confirm:active:not(:disabled) {
  transform: translateY(0);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #9ca3af !important;
  box-shadow: none !important;
}

/* ===== Video Modal Specific Styles ===== */
.video-modal {
  max-width: 650px;
}

/* ===== Image Modal Specific Styles ===== */
.image-modal {
  max-width: 650px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex: 1;
}

.header-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.form-section {
  margin-bottom: 24px;
}

.modal-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.label-icon {
  font-size: 18px;
  line-height: 1;
}

.modal-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-md);
  font-size: 15px;
  color: var(--nw-text-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: var(--nw-font-body);
  background: var(--nw-surface);
}

.modal-input:focus {
  outline: none;
  border-color: var(--nw-primary);
  box-shadow: 0 0 0 3px rgba(26, 35, 50, 0.1);
}

.modal-input::placeholder {
  color: var(--nw-text-muted);
}

/* Info Section styles moved to @/styles/urlFormatInfo.css */

/* Image Modal Tab Styles */
.image-source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--nw-surface);
  border-radius: var(--nw-radius-md);
  border: 1px solid var(--nw-border);
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: var(--nw-radius-sm);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--nw-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--nw-font-body);
}

.tab-btn.active {
  background: var(--nw-primary);
  color: white;
  box-shadow: var(--nw-shadow-sm);
}

.tab-btn:hover:not(.active) {
  color: var(--nw-text-primary);
  background: var(--nw-surface-hover);
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

/* Image Type Selection Styles */
.image-type-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--nw-border);
}

.image-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px;
  background: var(--nw-surface);
  border-radius: var(--nw-radius-md);
  border: 1px solid var(--nw-border);
}

.type-tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  border-radius: var(--nw-radius-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--nw-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-family: var(--nw-font-body);
}

.type-tab-btn.active {
  background: var(--nw-primary);
  color: white;
  box-shadow: var(--nw-shadow-sm);
}

.type-tab-btn:hover:not(.active) {
  color: var(--nw-text-primary);
  background: var(--nw-surface-hover);
}

.type-description {
  text-align: center;
  margin-top: 8px;
}

.type-description p {
  font-size: 13px;
  color: var(--nw-text-secondary);
  margin: 0;
  font-style: italic;
}

/* Upload Area Styles */
.upload-area {
  margin-top: 16px;
  padding: 32px;
  border: 2px dashed var(--nw-border);
  border-radius: var(--nw-radius-lg);
  background: var(--nw-surface);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.upload-area:hover {
  border-color: var(--nw-primary);
  background: rgba(26, 35, 50, 0.05);
}

.upload-area.drag-over {
  border-color: var(--nw-accent);
  background: rgba(255, 107, 107, 0.1);
  border-width: 3px;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.6;
}

.upload-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--nw-text-primary);
  font-family: var(--nw-font-secondary);
}

.upload-subtext {
  margin: 0;
  font-size: 13px;
  color: var(--nw-text-secondary);
}

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.file-name {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--nw-text-primary);
  word-break: break-all;
  font-family: var(--nw-font-body);
}

.change-file-btn {
  padding: 8px 16px;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-sm);
  background: var(--nw-surface);
  font-size: 13px;
  font-weight: 600;
  color: var(--nw-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--nw-font-body);
}

.change-file-btn:hover {
  background: var(--nw-surface-hover);
  border-color: var(--nw-primary);
}

/* ===== Conflict Resolution Modal ===== */
.conflict-modal {
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.conflict-header-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.conflict-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.modal-subtitle {
  margin: 8px 0 0 0;
  font-size: 13px;
  font-weight: normal;
  color: #6b7280;
  line-height: 1.5;
}

.conflict-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Conflict Item Card */
.conflict-item {
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.conflict-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.conflict-item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.conflict-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.conflict-info {
  flex: 1;
  min-width: 0;
}

.conflict-filename {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.file-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.filename-text {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  font-family: 'Monaco', 'Courier New', monospace;
  word-break: break-all;
}

.conflict-path {
  font-size: 12px;
  color: #6b7280;
  font-family: 'Monaco', 'Courier New', monospace;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

/* Action Options */
.conflict-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conflict-action-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.conflict-action-label:hover {
  background: #f5f5f5;
  border-color: #d1d5db;
}

.conflict-action-label.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.conflict-action-label input[type="radio"] {
  margin-top: 3px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: #3b82f6;
}

.action-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.action-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}

.overwrite-icon {
  filter: grayscale(0.3);
}

.rename-icon {
  filter: grayscale(0.3);
}

.conflict-action-label.active .action-icon {
  filter: grayscale(0);
  animation: icon-bounce 0.5s ease;
}

@keyframes icon-bounce {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.15);
  }
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  user-select: none;
}

.action-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  user-select: none;
}

/* Rename Input Container */
.rename-input-container {
  margin-left: 30px;
  padding-left: 42px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rename-input {
  padding: 10px 12px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Monaco', 'Courier New', monospace;
  width: 100%;
  box-sizing: border-box;
  background: white;
  transition: all 0.2s ease;
}

.rename-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rename-input::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.input-hint {
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
  padding-left: 4px;
}

/* Modal Footer Enhanced */
.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 2px solid #f3f4f6;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
}

.info-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  font-weight: 500;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #9ca3af !important;
}

.modal-btn:disabled:hover {
  background: #9ca3af !important;
  transform: none;
}

/* Drop Cap */
:deep(p[data-dropcap="1"]::first-letter) {
  initial-letter: var(--dropcap-lines, 2);
  -webkit-initial-letter: var(--dropcap-lines, 2);
  font-weight: 700;
  margin-right: 0.1em;
}

/* not supported initial-letter */
@supports not (initial-letter: 2) {
  :deep(p[data-dropcap="1"]) {
    line-height: var(--lh, 1.5);
  }

  :deep(p[data-dropcap="1"]::first-letter) {
    float: left;
    font-size: calc(var(--lh, 1.5) * var(--dropcap-lines, 2) * 1em);
    line-height: 1;
    margin-right: 0.25em;
    font-weight: 700;
  }
}

.slider-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.slider-container input[type="range"] {
  width: 100%;
  max-width: 100%;
}
</style>
