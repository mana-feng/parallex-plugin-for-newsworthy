<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
        <Transition name="dialog-scale">
          <div v-if="isVisible" class="dialog-container" @click.stop>
            <!-- Icon -->
            <div class="dialog-icon" :class="`dialog-icon-${type}`">
              <span class="icon-emoji">{{ icon }}</span>
            </div>
            
            <!-- Content -->
            <div class="dialog-content">
              <h3 class="dialog-title">{{ title }}</h3>
              <p v-if="message" class="dialog-message">{{ message }}</p>
            </div>
            
            <!-- Buttons -->
            <div class="dialog-buttons">
              <button 
                v-if="showCancel"
                class="dialog-button dialog-button-cancel"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button 
                class="dialog-button dialog-button-confirm"
                :class="`dialog-button-${type}`"
                @click="handleConfirm"
                ref="confirmButton"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const isVisible = ref(false)
const type = ref('confirm') // 'confirm', 'alert', 'warning', 'danger'
const icon = ref('?')
const title = ref('')
const message = ref('')
const confirmText = ref('OK')
const cancelText = ref('Cancel')
const showCancel = ref(true)
const resolveCallback = ref(null)
const confirmButton = ref(null)

// Watch for visibility changes to focus the confirm button
watch(isVisible, async (newVal) => {
  if (newVal) {
    await nextTick()
    confirmButton.value?.focus()
  }
})

const show = (options = {}) => {
  return new Promise((resolve) => {
    type.value = options.type || 'confirm'
    icon.value = options.icon || getDefaultIcon(type.value)
    title.value = options.title || 'Confirm'
    message.value = options.message || ''
    confirmText.value = options.confirmText || 'OK'
    cancelText.value = options.cancelText || 'Cancel'
    showCancel.value = options.showCancel !== false
    resolveCallback.value = resolve
    isVisible.value = true
  })
}

const getDefaultIcon = (dialogType) => {
  const icons = {
    confirm: '?',
    alert: 'i',
    warning: '!',
    danger: 'X',
    success: '✓'
  }
  return icons[dialogType] || '?'
}

const handleConfirm = () => {
  isVisible.value = false
  if (resolveCallback.value) {
    resolveCallback.value(true)
    resolveCallback.value = null
  }
}

const handleCancel = () => {
  isVisible.value = false
  if (resolveCallback.value) {
    resolveCallback.value(false)
    resolveCallback.value = null
  }
}

const handleOverlayClick = () => {
  if (showCancel.value) {
    handleCancel()
  }
}

// Expose methods
defineExpose({
  show
})
</script>

<style scoped>
/* Overlay */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 35, 50, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* Container */
.dialog-container {
  background: var(--nw-surface);
  border-radius: var(--nw-radius-lg);
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: var(--nw-shadow-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Icon */
.dialog-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: iconPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconPop {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.icon-emoji {
  font-size: 40px;
  line-height: 1;
}

/* Icon types */
.dialog-icon-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dialog-icon-alert {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.dialog-icon-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.dialog-icon-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.dialog-icon-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Content */
.dialog-content {
  margin-bottom: 32px;
  width: 100%;
}

.dialog-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--nw-text-primary);
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.dialog-message {
  font-size: 16px;
  color: var(--nw-text-secondary);
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
}

/* Buttons */
.dialog-buttons {
  display: flex;
  gap: 12px;
  width: 100%;
}

.dialog-button {
  flex: 1;
  padding: 14px 24px;
  border-radius: var(--nw-radius-md);
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  position: relative;
  overflow: hidden;
}

.dialog-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.dialog-button:active::before {
  width: 300px;
  height: 300px;
}

.dialog-button-cancel {
  background: var(--nw-surface-hover);
  color: var(--nw-text-secondary);
}

.dialog-button-cancel:hover {
  background: var(--nw-border);
  transform: translateY(-2px);
  box-shadow: var(--nw-shadow-sm);
}

.dialog-button-cancel:active {
  transform: translateY(0);
}

.dialog-button-confirm {
  color: var(--nw-text-light);
  position: relative;
}

.dialog-button-confirm:hover {
  transform: translateY(-2px);
  box-shadow: var(--nw-shadow-md);
}

.dialog-button-confirm:active {
  transform: translateY(0);
}

.dialog-button-confirm:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

/* Button types */
.dialog-button-confirm.dialog-button-confirm {
  background: var(--nw-accent);
}

.dialog-button-confirm.dialog-button-alert {
  background: var(--nw-accent-teal);
}

.dialog-button-confirm.dialog-button-warning {
  background: var(--nw-accent-gold);
}

.dialog-button-confirm.dialog-button-danger {
  background: var(--nw-accent-red);}

.dialog-button-confirm.dialog-button-success {
  background: var(--nw-accent-green);
}

/* Animations */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.dialog-scale-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

/* Responsive */
@media (max-width: 640px) {
  .dialog-container {
    padding: 24px;
    max-width: 100%;
  }
  
  .dialog-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
  }
  
  .icon-emoji {
    font-size: 32px;
  }
  
  .dialog-title {
    font-size: 20px;
  }
  
  .dialog-message {
    font-size: 14px;
  }
  
  .dialog-buttons {
    flex-direction: column-reverse;
  }
  
  .dialog-button {
    width: 100%;
  }
}

/* Keyboard focus */
.dialog-button:focus-visible {
  outline: 3px solid rgba(99, 102, 241, 0.5);
  outline-offset: 2px;
}
</style>

