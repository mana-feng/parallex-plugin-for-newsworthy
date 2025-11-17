<template>
  <div>
    <button class="nw-sidebar-btn nw-sidebar-btn-secondary" @click="handleAddVideo" :disabled="disabled">
      <span class="btn-icon">🎥</span>
      <span>Add Video Block</span>
    </button>

    <!-- Video Modal -->
    <div v-if="showVideoModal" class="modal-overlay" @click.self="closeVideoModal">
      <div class="modal-container video-modal">
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon">▶</div>
            <div>
              <h3>Add YouTube Video</h3>
              <p class="modal-subtitle">Embed a YouTube video into your page</p>
            </div>
          </div>
          <button class="modal-close" @click="closeVideoModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <label class="modal-label">
              <span class="label-icon">🔗</span>
              YouTube Video URL
            </label>
            <input
              type="text"
              v-model="videoUrl"
              class="modal-input"
              placeholder="Paste your YouTube URL here..."
              @keyup.enter="confirmAddVideo"
              ref="videoUrlInput"
            />
          </div>

          <div class="url-format-info-section">
            <div class="url-format-info-header">
              <span class="url-format-info-icon">💡</span>
              <span class="url-format-info-title">Supported URL Formats</span>
            </div>
            <div class="url-format-list">
              <div class="url-format-item">
                <span class="url-format-icon">🎥</span>
                <div class="url-format-details">
                  <div class="url-format-title">Standard Video</div>
                  <div class="url-format-example">youtube.com/watch?v=VIDEO_ID</div>
                </div>
              </div>
              <div class="url-format-item">
                <span class="url-format-icon">🔗</span>
                <div class="url-format-details">
                  <div class="url-format-title">Short Link</div>
                  <div class="url-format-example">youtu.be/VIDEO_ID</div>
                </div>
              </div>
              <div class="url-format-item">
                <span class="url-format-icon">📱</span>
                <div class="url-format-details">
                  <div class="url-format-title">Shorts</div>
                  <div class="url-format-example">youtube.com/shorts/VIDEO_ID</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancel" @click="closeVideoModal">
            <span class="btn-icon">✕</span>
            Cancel
          </button>
          <button class="modal-btn modal-btn-confirm" @click="confirmAddVideo" :disabled="!videoUrl.trim()">
            <span class="btn-icon">✓</span>
            Add Video
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import * as dialog from '@/utils/dialog'
import '@/styles/urlFormatInfo.css'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const store = useEditorStore()
const showVideoModal = ref(false)
const videoUrl = ref('')
const videoUrlInput = ref(null)

const handleAddVideo = () => {
  showVideoModal.value = true
  videoUrl.value = ''
  nextTick(() => videoUrlInput.value?.focus())
}

const closeVideoModal = () => {
  showVideoModal.value = false
  videoUrl.value = ''
}

const confirmAddVideo = async () => {
  if (!videoUrl.value.trim()) {
    await dialog.warning('Please enter a YouTube URL.\n\nA valid YouTube video URL is required.', {
      title: 'URL Required',
      icon: '⚠️'
    })
    return
  }

  store.addVideoBlock(videoUrl.value.trim())
  closeVideoModal()
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for video block button */
}

.btn-icon {
  margin-right: 8px;
  font-weight: bold;
}

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
}

.video-modal {
  max-width: 650px;
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
}

.modal-body {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
}

.modal-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.modal-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.modal-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  padding: 20px 28px;
  border-top: 2px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.modal-btn-cancel:hover {
  background: #e5e7eb;
}

.modal-btn-confirm {
  background: #3b82f6;
  color: white;
}

.modal-btn-confirm:hover:not(:disabled) {
  background: #2563eb;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

