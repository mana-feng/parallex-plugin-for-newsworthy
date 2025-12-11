<!-- eslint-disable no-unused-vars -->
<template>
  <aside class="sidebar">
    <!-- <div class="side-title">Sidebar</div> -->

    <div class="btns">

      <AddSectionButton v-if="!hideSectionAddButtons" @add="$emit('add-section')" />
      <AddParallaxButton v-if="!hideSectionAddButtons" @add="$emit('add-parallax')" />

      <AddTextBlockButton v-if="showAddTextButton" :disabled="!canAddBlocks" />

      <AddImageBlockButton v-if="!hideSectionAddButtons" :disabled="!canAddBlocks" @add-image="handleAddImage" />
      <AddVideoBlockButton v-if="showMediaButtons" :disabled="!canAddBlocks" />
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
              <!-- <button class="type-tab-btn" :class="{ active: imageType === 'float' }" @click="imageType = 'float'">
                📝 Float & Text
              </button> -->
            </div>
            <div class="type-description">
              <p v-if="imageType === 'normal'">Standard image block with caption</p>
              <p v-if="imageType === 'fullwidth'">Full-width image that spans the entire section</p>
              <!-- <p v-if="imageType === 'float'">Image with text wrapping around it</p> -->
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

    <div class="details">
      <div class="detail-title">Detail Editing Area</div>

      <div v-if="!store.selected.type" class="empty">
        Choose a section/text block/img block in Canvas to get editing tools.
      </div>

      <div v-else-if="store.selected.type === 'section'" class="section-panel">
        <div class="panel-header">Section Setting</div>

        <div class="setting-item">
          <label>Background Color</label>
          <input type="color" v-model="bgColorProxy" />
        </div>

        <label class="setting-item">
          <span>Height(px)</span>
          <input type="number" min="100" :value="store.currSection?.props.height || 500"
            @input="store.setSecHeight($event.target.value)" />
        </label>

        <button class="danger-btn" @click="store.deleteSelected">Delete</button>
      </div>

      <div v-else-if="store.selected.type === 'text'" class="mt-4 rounded bg-white/70 p-3">
        <div class="tool-card">
          <div class="tool-title">Text Style</div>
          <div class="seg">
            <button class="seg-btn" title="Title" aria-label="Title"
              :class="{ active: store.activeEditor?.isActive('heading', { level: 1 }) }" @click="setHeading(1)">
              T
            </button>

            <button class="seg-btn" title="Subtitle" aria-label="Subtitle"
              :class="{ active: store.activeEditor?.isActive('heading', { level: 2 }) }" @click="setHeading(2)">
              S
            </button>

            <button class="seg-btn" title="Body" aria-label="Body" :class="{
              active:
                !store.activeEditor?.isActive('heading', { level: 1 }) &&
                !store.activeEditor?.isActive('heading', { level: 2 })
            }" @click="setParagraph">
              B
            </button>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-title">Font & Size</div>
          <div>
            <div class="field">
              <select @change="setFontFamily($event.target.value || null)">
                <option value="">Default</option>
                <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                <option value='Georgia, "Times New Roman", Times, serif'>Georgia</option>
                <option value='Calibri, "Segoe UI", Roboto, Arial, Helvetica, sans-serif'>Calibri</option>
                <option value='Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Inter</option>
                <option value='Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Roboto</option>
                <option value='Arial, "Helvetica Neue", Helvetica, sans-serif'>Arial</option>
                <option value='"Helvetica Neue", Helvetica, Arial, sans-serif'>Helvetica Neue</option>
                <option value='"Courier New", Courier, monospace'>Courier New</option>
                <option value='ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'>Serif</option>
                <option
                  value='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'>
                  Sans-serif</option>
                <option
                  value='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>
                  Monospace</option>
              </select>
            </div>
            <div class="field">
              <select v-model="currentFontSize" @change="setFontSize($event.target.value || null)">
                <option value="">Default</option>
                <option value="8px">8</option>
                <option value="9px">9</option>
                <option value="10px">10</option>
                <option value="11px">11</option>
                <option value="12px">12</option>
                <option value="14px">14</option>
                <option value="16px">16</option>
                <option value="18px">18</option>
                <option value="20px">20</option>
                <option value="24px">24</option>
                <option value="28px">28</option>
                <option value="32px">32</option>
                <option value="36px">36</option>
                <option value="48px">48</option>
              </select>
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-title">Text Align</div>
          <div class="seg">
            <button class="seg-btn" title="Left" aria-label="Left" :class="{ active: isActiveAlign('left') }"
              @click="setAlign('left')">
              Left
            </button>
            <button class="seg-btn" title="Center" aria-label="Center" :class="{ active: isActiveAlign('center') }"
              @click="setAlign('center')">
              Center
            </button>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-title">Font Formatting</div>
          <div class="seg">
            <button class="seg-btn" title="Bold" aria-label="Bold"
              :class="{ active: store.activeEditor?.isActive('bold') }" @click="toggleBold">
              <strong>B</strong>
            </button>
            <button class="seg-btn" title="Italic" aria-label="Italic"
              :class="{ active: store.activeEditor?.isActive('italic') }" @click="toggleItalic">
              <em>I</em>
            </button>
          </div>
          <div class="tool-title">Drop Cap</div>
          <div class="seg">
            <button class="seg-btn" title="Toggle Drop Cap" @click="toggleDropCap">
              Drop
            </button>
          </div>
        </div>

        <!-- Block Width -->
        <div class="tool-card">
          <div class="tool-title">Block Width</div>

          <div class="slider-container">
            <div class="field">
              <input type="range" min="30" max="120" step="1" :value="textWidthValueCh"
                @input="onWidthSlider($event.target.value)" />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="field-label">Width</label>
              <input type="number" min="30" max="120" step="1" :value="textWidthValueCh"
                @input="onWidthNumber($event.target.value)" />
            </div>
            <div class="field">
              <label class="field-label">Current</label>
              <input type="text" :value="currentWidthDisplay" readonly />
            </div>
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-title">Text Color</div>
          <div class="seg" style="justify-content: center;">
            <input type="color" v-model="textColor" @input="applyColor" class="color-picker" />
          </div>
        </div>

        <div class="tool-card">
          <div class="tool-title">Set Link</div>
          <div class="seg">
            <button class="seg-btn" title="Insert Link" aria-label="Insert Link" @click="setLink">
              Insert
            </button>
            <!-- <button class="seg-btn" title="Remove Link" aria-label="Remove Link" @click="unsetLink">
              Remove
            </button> -->
          </div>
        </div>

        <div class="delete-wrapper">
          <button class="delete-btn small" @click="store.deleteSelected">Delete</button>
        </div>
      </div>

      <ImageSettingsPanel v-else-if="store.selected.type === 'image'" :model="store.currImage" title="Image Settings"
        @updateWidth="store.setImgWidth" @updateHeight="store.setImgHeight" @updateKeepRatio="store.setImgKeepRatio"
        @updateCaption="store.setImgCaption" @updateCaptionPosition="store.setImgCaptionPosition"
        @updateCaptionBubbleAnimated="store.setImgCaptionBubbleAnimated" @replaceImage="replaceImage"
        @deleteImage="store.deleteSelected" @updateCaptionFontSize="handleCaptionFontSize" />


      <ImageSettingsPanel v-else-if="store.selected.type === 'fullwidth-image'"
        :model="{ image: store.currBlock?.image }" title="Full-Width Image Settings"
        @updateMode="store.setFullWidthImgMode" @updateHeight="store.setFullWidthImgHeight"
        @updateCaption="store.setFullWidthImgCaption" @updateCaptionPosition="store.setFullWidthImgCaptionPosition"
        @updateCaptionBubbleAnimated="store.setFullWidthImgCaptionBubbleAnimated" @replaceImage="replaceImage"
        @deleteImage="store.deleteSelected" @updateCaptionFontSize="handleCaptionFontSize" />

      <template v-else-if="store.selected.type === 'float-image'">
        <div v-if="store.selected.part === 'image'" class="mt-4 rounded bg-white/70 p-3">
          <div class="panel-header">Float Image Settings</div>

          <div class="setting-item">
            <label>Alignment</label>
            <select :value="store.currBlock?.image?.align || 'right'"
              @change="e => store.setFloatImgAlign(e.target.value)">
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div class="setting-item">
            <label>Width: {{ store.currBlock?.image?.widthPercent ?? 45 }}%</label>
            <input type="range" min="20" max="70" step="1" :value="store.currBlock?.image?.widthPercent ?? 45"
              @input="e => store.setFloatImgWidth(Number(e.target.value))" />
          </div>

          <div class="setting-item">
            <label>Caption</label>
            <textarea rows="2" placeholder="Enter caption (optional)…" :value="store.currBlock?.image?.caption || ''"
              @input="e => store.setFloatImgCaption(e.target.value)" />
          </div>

          <div class="setting-item">
            <label>Caption Position</label>
            <select :value="store.currBlock?.image?.captionPosition || 'bottom'"
              @change="e => store.setFloatImgCaptionPosition(e.target.value)">
              <option value="bottom">Bottom</option>
              <option value="bubble">Bubble</option>
            </select>
          </div>

          <div class="setting-item" v-if="store.currBlock?.image?.captionPosition === 'bubble'">
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" :checked="!!store.currBlock?.image?.captionBubbleAnimated"
                @change="e => store.setFloatImgCaptionBubbleAnimated(e.target.checked)" />
              Animate bubble
            </label>
          </div>

          <div class="flex gap-2">
            <button class="btn" @click="replaceImage">Replace Image</button>
            <button class="btn btn-danger" @click="store.deleteSelected">Delete</button>
          </div>
        </div>

        <div v-else-if="store.selected.part === 'text'" class="mt-4 rounded bg-white/70 p-3">
          <div class="panel-header">Float Image Text Setting</div>
          <div class="tool-card">
            <div class="tool-title">Text Style</div>
            <div class="seg">
              <button class="seg-btn" title="Title" aria-label="Title"
                :class="{ active: store.activeEditor?.isActive('heading', { level: 1 }) }" @click="setHeading(1)">
                T
              </button>
              <button class="seg-btn" title="Subtitle" aria-label="Subtitle"
                :class="{ active: store.activeEditor?.isActive('heading', { level: 2 }) }" @click="setHeading(2)">
                S
              </button>
              <button class="seg-btn" title="Body" aria-label="Body" :class="{
                active:
                  !store.activeEditor?.isActive('heading', { level: 1 }) &&
                  !store.activeEditor?.isActive('heading', { level: 2 })
              }" @click="setParagraph">
                B
              </button>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-title">Font & Size</div>
            <div class="row">
              <div class="field">
                <select @change="setFontFamily($event.target.value || null)">
                  <option value="">Default</option>
                  <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                  <option value='Georgia, "Times New Roman", Times, serif'>Georgia</option>
                  <option value='Calibri, "Segoe UI", Roboto, Arial, Helvetica, sans-serif'>Calibri</option>
                  <option value='Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Inter</option>
                  <option value='Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Roboto</option>
                  <option value='Arial, "Helvetica Neue", Helvetica, sans-serif'>Arial</option>
                  <option value='"Helvetica Neue", Helvetica, Arial, sans-serif'>Helvetica Neue</option>
                  <option value='"Courier New", Courier, monospace'>Courier New</option>
                  <option value='ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'>Serif</option>
                  <option
                    value='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'>
                    Sans-serif
                  </option>
                  <option
                    value='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>
                    Monospace
                  </option>
                </select>
              </div>
              <div class="field">
                <select @change="setFontSize($event.target.value || null)">
                  <option value="">Default</option>
                  <option value="8px">8</option>
                  <option value="9px">9</option>
                  <option value="10px">10</option>
                  <option value="11px">11</option>
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="18px">18</option>
                  <option value="20px">20</option>
                  <option value="24px">24</option>
                  <option value="28px">28</option>
                  <option value="32px">32</option>
                  <option value="36px">36</option>
                  <option value="48px">48</option>
                </select>
              </div>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-title">Text Align</div>
            <div class="seg">
              <button class="seg-btn" title="Left" aria-label="Left" :class="{ active: isActiveAlign('left') }"
                @click="setAlign('left')">Left</button>
              <button class="seg-btn" title="Center" aria-label="Center" :class="{ active: isActiveAlign('center') }"
                @click="setAlign('center')">Center</button>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-title">Font Formatting</div>
            <div class="seg">
              <button class="seg-btn" title="Bold" aria-label="Bold"
                :class="{ active: store.activeEditor?.isActive('bold') }"
                @click="toggleBold"><strong>B</strong></button>
              <button class="seg-btn" title="Italic" aria-label="Italic"
                :class="{ active: store.activeEditor?.isActive('italic') }" @click="toggleItalic"><em>I</em></button>
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-title">Text Color</div>
            <div class="seg" style="justify-content: center;">
              <input type="color" v-model="textColor" @input="applyColor" class="color-picker" />
            </div>
          </div>

          <div class="tool-card">
            <div class="tool-title">Set Link</div>
            <div class="seg">
              <button class="seg-btn" title="Insert Link" aria-label="Insert Link" @click="setLink">Insert</button>
              <button class="seg-btn" title="Remove Link" aria-label="Remove Link" @click="unsetLink">Remove</button>
            </div>
          </div>

          <div class="delete-wrapper">
            <button class="delete-btn small" @click="store.deleteSelected">Delete</button>
          </div>
        </div>
        <div v-else class="empty">
          Click the image or text area to edit its settings.
        </div>
      </template>

      <div v-else-if="store.selected.type === 'video'" class="mt-4 rounded bg-white/70 p-3">
        <div class="panel-header">Video Settings</div>

        <div class="setting-item">
          <label>YouTube URL</label>
          <input type="text" :value="store.currBlock?.url || ''" @input="store.setVideoUrl($event.target.value)"
            placeholder="https://www.youtube.com/watch?v=..." />
          <small style="display: block; margin-top: 4px; color: #666;">
            Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
          </small>
        </div>

        <div class="setting-item">
          <label>Width: {{ store.currBlock?.width }} px</label>
          <input type="range" min="200" max="1200" step="10" :value="store.currBlock?.width || 560"
            @input="onWidthChange($event.target.value)" />
        </div>

        <div class="setting-item">
          <label>Height: {{ store.currBlock?.height }} px</label>
          <input type="range" min="150" max="1000" step="10" :value="store.currBlock?.height || 315"
            :disabled="store.currBlock?.keepRatio" @input="store.setVideoHeight($event.target.value)" />
        </div>

        <!-- Keep ratio -->
        <div class="setting-item">
          <label>
            <input type="checkbox" :checked="store.currBlock?.keepRatio"
              @change="onToggleRatio($event.target.checked)" />
            Keep Aspect Ratio (16:9)
          </label>
        </div>

        <div class="flex gap-2">
          <button class="btn btn-danger" @click="store.deleteSelected">Delete Video</button>
        </div>
      </div>
    </div>

    <div class="btns" v-if="!hideSectionAddButtons">
      <button class="btn btn-storage" @click="$emit('open-storage')">Storage Manager</button>
      <button class="btn btn-settings" @click="$emit('open-settings')">⚙ Settings</button>
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

const isTextSelected = computed(() => store.selected.type === 'text')

const isParallaxSelected = computed(() => {
  const sec = curr.value
  if (!sec) return false
  return sec.type !== 'section'
})

const hideSectionAddButtons = computed(() => {
  return store.selected.type === 'text'
})

const canAddBlocks = computed(() => {
  return !!curr.value && !isParallaxSelected.value
})

const showAddTextButton = computed(() => {
  if (!canAddBlocks.value) return false
  return store.selected.type === 'section'
})

// const showMediaButtons = computed(() => {
//   if (!canAddBlocks.value) return false
//   return store.selected.type === 'section'
// })

const showMediaButtons = computed(() => {
  if (!canAddBlocks.value) return false
  const t = store.selected.type
  return t === 'section' || t === 'image' || t === 'fullwidth-image' || t === 'float-image'
})


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
    let sizePx = LINES * lh_px * 0.95
    sizePx = Math.max(sizePx, f_p * MIN_DROP_SCALE)

    if (f_p < 16) {
      sizePx = 32
    }

    console.log({ f_p, lh_px, sizePx })

    chain.setMark('textStyle', {
      float: 'left',
      display: 'inline-block',
      fontSize: `${sizePx}px`,
      lineHeight: '1',
      marginRight: '0.25em',
      marginTop: '-0.2em',
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

const handleCaptionFontSize = (size) => {
  if (store.selected.type === 'image') {
    store.setImgCaptionFontSize(size);
  } else if (store.selected.type === 'fullwidth-image') {
    store.setFullWidthImgCaptionFontSize(size);
  } else if (store.selected.type === 'float-image') {
    store.setFloatImgCaptionFontSize(size);
  }
};

// Save functionality moved to SaveButton component in header/

</script>

<style scoped>
/* Sidebar layout */
.sidebar {
  height: 100%;
  padding: 16px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0px;
  background-color: #f3f4f6;
}

.side-title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #222;
}

/* Top area button */
.btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  position: relative;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #111111;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  text-align: left;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #9ca3af;
}

.btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0) 100%);
  transform: skewX(-20deg);
  transition: left 0.5s ease;
}

.btn:hover::after {
  left: 120%;
}

/* Parallax Button */
.btn-parallax {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #111111;
}

.btn-parallax:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Storage Button */
.btn-storage {
  background: #ffffff;
  border-color: #2563eb;
  color: #1e3a8a;
}

.btn-storage:hover:not(:disabled) {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
}

/* Settings Button */
.btn-settings {
  background: #ffffff;
  border-color: #6b7280;
  color: #374151;
}

.btn-settings:hover:not(:disabled) {
  background: #6b7280;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.25);
}

/* Detail buttons */
.details {
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 14px 14px 16px;
  border: 1px solid #eee;
  border-radius: 12px;
  background-color: #fafafa;
}

.detail-title {
  margin: 0 0 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.empty {
  padding: 10px 8px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

/* Generic field blocks */
.panel-header {
  margin: 12px 0 8px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12px;
}

.setting-item>span {
  font-weight: 600;
  color: #374151;
}

/* Form controls */
.details input[type="text"],
.details input[type="number"],
.details select,
.details textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.details input[type="color"] {
  width: 36px;
  height: 26px;
  padding: 0;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

/* Base danger button (legacy) */
.danger-btn {
  padding: 10px 12px;
  border: 1px solid #ef4444;
  color: #b91c1c;
  cursor: pointer;
  font-weight: 600;
}

/* Image preview */
.thumb {
  display: grid;
  gap: 8px;
}

.thumb-box {
  width: 100%;
  height: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}


/* Section panel */
.section-panel {
  padding: 12px;
  border: 1px solid #ececec;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .03);
}

.section-panel .panel-header {
  margin: 4px 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.section-panel .setting-item {
  gap: 8px;
  margin-bottom: 12px;
}

.section-panel .setting-item span {
  width: 100%;
  text-align: center;
  font-weight: 600;
}

.section-panel .setting-item select,
.section-panel .setting-item input[type="number"],
.section-panel .setting-item input[type="text"],
.section-panel .setting-item textarea {
  border-radius: 8px;
  border-color: #d1d5db;
}

.section-panel .setting-item select:focus,
.section-panel .setting-item input[type="number"]:focus,
.section-panel .setting-item input[type="text"]:focus,
.section-panel .setting-item textarea:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, .25);
}

.section-panel .setting-item input[type="color"] {
  width: 40px;
  height: 28px;
  border-radius: 8px;
}

.section-panel .thumb>span {
  font-size: 12px;
  color: #6b7280;
}

.section-panel .danger-btn {
  display: block;
  width: fit-content;
  margin: 10px auto 0;
  padding: 6px 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fee2e2;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
  transition: background .2s ease, transform .1s ease;
}

.section-panel .danger-btn:hover {
  background: #fecaca;
}

.section-panel .danger-btn:active {
  transform: scale(0.98);
}

.section-panel .thumb .danger-btn {
  margin: 4px 0 0;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
}

/* Tool card */
.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 10px;
  border: 1px solid #ececec;
  border-radius: 10px;
  background: #fff;
}

.tool-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: #4b5563;
}

.field select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #111827;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.field select:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, .25);
}

/* Segmented buttons */
.seg {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.seg-btn {
  min-width: 36px;
  padding: 4px 10px;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  transition: background .15s ease;
}

.seg-btn+.seg-btn {
  border-left: 1px solid #d1d5db;
}

.seg-btn:hover {
  background: #e5e7eb;
}

.seg-btn.active {
  background: #e0e7ff;
  font-weight: 600;
}

/* Text block delete */
.delete-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}

.delete-btn.small {
  padding: 4px 12px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fee2e2;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
  transition: background .2s ease, transform .1s ease;
}

.delete-btn.small:hover {
  background: #fecaca;
}

.delete-btn.small:active {
  transform: scale(0.97);
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
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
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
  border-bottom: 2px solid #f3f4f6;
  background: white;
  gap: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.modal-subtitle {
  margin: 6px 0 0 0;
  font-size: 14px;
  font-weight: normal;
  color: #6b7280;
  line-height: 1.5;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
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
  border-top: 2px solid #f3f4f6;
  background: #fafafa;
}

.modal-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.modal-btn-cancel {
  background: white;
  border: 2px solid #e5e7eb;
  color: #374151;
}

.modal-btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.modal-btn-confirm {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
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
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  color: #111827;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: 'Monaco', 'Courier New', monospace;
}

.modal-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.modal-input::placeholder {
  color: #9ca3af;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Info Section styles moved to @/styles/urlFormatInfo.css */

/* Image Modal Tab Styles */
.image-source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 10px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-btn:hover:not(.active) {
  color: #374151;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

/* Image Type Selection Styles */
.image-type-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.image-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 10px;
}

.type-tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.type-tab-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.type-tab-btn:hover:not(.active) {
  color: #374151;
  background: rgba(255, 255, 255, 0.5);
}

.type-description {
  text-align: center;
  margin-top: 8px;
}

.type-description p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  font-style: italic;
}

/* Upload Area Styles */
.upload-area {
  margin-top: 12px;
  padding: 32px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-area.drag-over {
  border-color: #2563eb;
  background: #dbeafe;
  border-width: 3px;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
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
  color: #374151;
}

.upload-subtext {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
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
  color: #374151;
  word-break: break-all;
}

.change-file-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.change-file-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
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
