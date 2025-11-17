<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-container input-modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-content">
              <div class="header-icon">{{ currentIcon }}</div>
              <div>
                <h3>{{ currentTitle }}</h3>
                <p v-if="currentSubtitle" class="modal-subtitle">{{ currentSubtitle }}</p>
              </div>
            </div>
            <button class="modal-close" @click="handleCancel" title="Close (Esc)">×</button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <div class="input-group">
              <label v-if="currentLabel" class="input-label">{{ currentLabel }}</label>
              <input
                ref="inputRef"
                v-model="inputValue"
                :type="currentInputType"
                :placeholder="currentPlaceholder"
                :readonly="currentReadonly"
                class="input-field"
                @keyup.enter="handleConfirm"
                @keyup.esc="handleCancel"
              />
              <p v-if="currentHint" class="input-hint">{{ currentHint }}</p>
            </div>

            <!-- Secondary Input (for dual input mode) -->
            <div v-if="currentShowSecondaryInput" class="input-group">
              <label v-if="currentSecondaryLabel" class="input-label">{{ currentSecondaryLabel }}</label>
              <input
                ref="secondaryInputRef"
                v-model="secondaryValue"
                :type="currentSecondaryInputType"
                :placeholder="currentSecondaryPlaceholder"
                class="input-field"
                @input="userEditedSecondary = true"
                @keyup.enter="handleConfirm"
                @keyup.esc="handleCancel"
              />
              <p v-if="currentSecondaryHint" class="input-hint">{{ currentSecondaryHint }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button v-if="currentCancelText" class="modal-btn modal-btn-cancel" @click="handleCancel">
              {{ currentCancelText }}
            </button>
            <button 
              class="modal-btn modal-btn-confirm" 
              @click="handleConfirm"
              :disabled="!isValid"
            >
              {{ currentConfirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '✎'
  },
  title: {
    type: String,
    default: 'Input'
  },
  subtitle: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  defaultValue: {
    type: String,
    default: ''
  },
  inputType: {
    type: String,
    default: 'text'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  required: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: false
  },
  // Secondary input props (for dual input mode)
  showSecondaryInput: {
    type: Boolean,
    default: false
  },
  secondaryLabel: {
    type: String,
    default: ''
  },
  secondaryPlaceholder: {
    type: String,
    default: ''
  },
  secondaryHint: {
    type: String,
    default: ''
  },
  secondaryDefaultValue: {
    type: String,
    default: ''
  },
  secondaryInputType: {
    type: String,
    default: 'text'
  },
  secondaryRequired: {
    type: Boolean,
    default: true
  },
  // Auto-sync props
  autoSyncSecondary: {
    type: Boolean,
    default: false
  },
  syncTransform: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const isVisible = ref(false)
const inputValue = ref('')
const secondaryValue = ref('')
const inputRef = ref(null)
const secondaryInputRef = ref(null)
const resolveCallback = ref(null)
const rejectCallback = ref(null)
const userEditedSecondary = ref(false) // Track if user manually edited secondary input

// Dynamic options that can be overridden by show() method
const dynamicOptions = ref({})

// Computed properties that merge props with dynamic options
const currentIcon = computed(() => dynamicOptions.value.icon ?? props.icon)
const currentTitle = computed(() => dynamicOptions.value.title ?? props.title)
const currentSubtitle = computed(() => dynamicOptions.value.subtitle ?? props.subtitle)
const currentLabel = computed(() => dynamicOptions.value.label ?? props.label)
const currentPlaceholder = computed(() => dynamicOptions.value.placeholder ?? props.placeholder)
const currentHint = computed(() => dynamicOptions.value.hint ?? props.hint)
const currentInputType = computed(() => dynamicOptions.value.inputType ?? props.inputType)
const currentShowSecondaryInput = computed(() => dynamicOptions.value.showSecondaryInput ?? props.showSecondaryInput)
const currentSecondaryLabel = computed(() => dynamicOptions.value.secondaryLabel ?? props.secondaryLabel)
const currentSecondaryPlaceholder = computed(() => dynamicOptions.value.secondaryPlaceholder ?? props.secondaryPlaceholder)
const currentSecondaryHint = computed(() => dynamicOptions.value.secondaryHint ?? props.secondaryHint)
const currentSecondaryInputType = computed(() => dynamicOptions.value.secondaryInputType ?? props.secondaryInputType)
const currentConfirmText = computed(() => dynamicOptions.value.confirmText ?? props.confirmText)
const currentCancelText = computed(() => dynamicOptions.value.cancelText ?? props.cancelText)
const currentReadonly = computed(() => dynamicOptions.value.readonly ?? props.readonly)

const isValid = computed(() => {
  const primaryValid = !props.required || inputValue.value.trim().length > 0
  const showSecondary = currentShowSecondaryInput.value
  const secondaryReq = dynamicOptions.value.secondaryRequired ?? props.secondaryRequired
  const secondaryValid = !showSecondary || !secondaryReq || secondaryValue.value.trim().length > 0
  return primaryValid && secondaryValid
})

// Watch for visibility changes to focus input
watch(isVisible, async (newVal) => {
  if (newVal) {
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
})

// Auto-sync secondary input based on primary input
watch(inputValue, (newVal) => {
  const autoSync = dynamicOptions.value.autoSyncSecondary ?? props.autoSyncSecondary
  const transform = dynamicOptions.value.syncTransform ?? props.syncTransform
  
  // Only auto-sync if:
  // 1. Auto-sync is enabled
  // 2. User hasn't manually edited the secondary input
  // 3. Transform function is provided
  if (autoSync && !userEditedSecondary.value && transform) {
    secondaryValue.value = transform(newVal)
  }
})

function show(options = {}) {
  return new Promise((resolve, reject) => {
    // Store dynamic options
    dynamicOptions.value = options
    
    inputValue.value = options.defaultValue || props.defaultValue || ''
    secondaryValue.value = options.secondaryDefaultValue || props.secondaryDefaultValue || ''
    userEditedSecondary.value = false // Reset the flag
    isVisible.value = true
    resolveCallback.value = resolve
    rejectCallback.value = reject
  })
}

function handleConfirm() {
  if (!isValid.value) return
  
  const result = currentShowSecondaryInput.value
    ? { primary: inputValue.value.trim(), secondary: secondaryValue.value.trim() }
    : inputValue.value.trim()
  
  emit('confirm', result)
  if (resolveCallback.value) {
    resolveCallback.value(result)
  }
  close()
}

function handleCancel() {
  emit('cancel')
  if (rejectCallback.value) {
    rejectCallback.value(null)
  }
  close()
}

function close() {
  isVisible.value = false
  inputValue.value = ''
  secondaryValue.value = ''
  userEditedSecondary.value = false
  resolveCallback.value = null
  rejectCallback.value = null
  dynamicOptions.value = {}
}

// Expose methods
defineExpose({
  show,
  close
})

// Handle ESC key globally when modal is open
watch(isVisible, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleEscKey)
  } else {
    document.removeEventListener('keydown', handleEscKey)
  }
})

function handleEscKey(e) {
  if (e.key === 'Escape' && isVisible.value) {
    handleCancel()
  }
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 35, 50, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

/* Modal Container */
.modal-container {
  background: var(--nw-surface);
  border-radius: var(--nw-radius-lg);
  box-shadow: var(--nw-shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.input-modal-container {
  max-width: 550px;
}

/* Modal Header */
.modal-header {
  padding: 24px 24px 20px;
  border-bottom: 2px solid var(--nw-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, var(--nw-surface) 0%, var(--nw-surface-hover) 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.header-icon {
  font-size: 48px;
  line-height: 1;
  flex-shrink: 0;
  animation: iconBounce 0.6s ease-out;
}

@keyframes iconBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.header-content h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--nw-text-primary);
  line-height: 1.3;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--nw-text-secondary);
  line-height: 1.4;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  color: var(--nw-text-muted);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--nw-radius-sm);
  transition: all 0.2s ease;
  flex-shrink: 0;
  line-height: 1;
}

.modal-close:hover {
  background-color: var(--nw-surface-hover);
  color: var(--nw-text-primary);
  transform: rotate(90deg);
}

/* Modal Body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.input-group {
  margin-bottom: 20px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 2px solid var(--nw-border);
  border-radius: var(--nw-radius-md);
  background: var(--nw-surface);
  color: #1f2937;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: var(--nw-accent);
  box-shadow: 0 0 0 3px var(--nw-accent-transparent);
  background: #ffffff;
}

.input-field::placeholder {
  color: var(--nw-text-muted);
}

.input-field[readonly] {
  background: var(--nw-surface-hover);
  cursor: default;
  user-select: all;
}

.input-field[readonly]:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-hint {
  margin: 6px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

/* Modal Footer */
.modal-footer {
  padding: 16px 24px;
  background-color: #fafafa;
  border-top: 1px solid var(--nw-border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--nw-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.modal-btn-cancel {
  background: var(--nw-surface);
  color: var(--nw-text-secondary);
  border: 2px solid var(--nw-border);
}

.modal-btn-cancel:hover {
  background: var(--nw-surface-hover);
  border-color: var(--nw-border-hover);
  transform: translateY(-1px);
}

.modal-btn-confirm {
  background: var(--nw-accent);
  color: var(--nw-text-light);
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.modal-btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4);
}

.modal-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
}

/* Responsive Design */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-width: 100%;
    border-radius: 12px;
  }

  .modal-header {
    padding: 20px 16px 16px;
  }

  .header-icon {
    font-size: 40px;
  }

  .header-content h3 {
    font-size: 20px;
  }

  .modal-subtitle {
    font-size: 13px;
  }

  .modal-body {
    padding: 20px 16px;
  }

  .modal-footer {
    padding: 12px 16px;
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: unset;
  }

  .input-field {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>
