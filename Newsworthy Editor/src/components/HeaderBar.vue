<template>
    <header class="header-bar nw-nav">
        <div class="header-left">
            <button class="nw-btn nw-btn-ghost home-btn" @click="handleReturnHome" title="Return to initial empty page">
                <span class="nw-icon">⌂</span>
                <span>Home</span>
            </button>

            <!-- Device selector -->
            <select v-model="store.selectedDeviceId" @change="store.selectDevice(store.selectedDeviceId)"
                class="nw-select device-select">
                <option value="pc">PC</option>
                <option value="tablet">Tablet (768px)</option>
                <option value="mobile">Mobile (375px)</option>
            </select>
        </div>
        <h1 class="nw-heading nw-heading-3 header-title">
            Newsworthy Editor
            <span v-if="store.currentPageInfo.isLoaded" class="editing-indicator nw-text-small">
                Editing: {{ store.currentPageInfo.title }}
            </span>
        </h1>
        <div class="actions">
            <UpdateButton v-if="store.currentPageInfo.isLoaded" :disabled="store.sections.length === 0" />
            <SaveButton :disabled="store.sections.length === 0" />
            <button class="nw-btn nw-btn-primary preview-btn" @click="store.togglePreview">
                <span class="nw-icon">👁</span>
                <span>Preview</span>
            </button>
        </div>
    </header>
</template>

<script setup>
import { useEditorStore } from '@/stores/editorStore'
import SaveButton from './header/SaveButton.vue'
import UpdateButton from './header/UpdateButton.vue'

const store = useEditorStore()

const handleReturnHome = async () => {
    await store.returnToHome()
}
</script>

<style scoped>
.header-bar {
  background: white;
  border-bottom: 1px solid var(--nw-neutral-200);
  box-shadow: var(--nw-shadow-sm);
  padding: var(--nw-space-md) var(--nw-space-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--nw-space-md);
  min-width: 120px;
}

.header-title {
  margin: 0;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--nw-space-xs);
}

.editing-indicator {
  opacity: 0.7;
  font-style: italic;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--nw-space-sm);
}

.device-select {
  margin-left: 0;
  min-width: 120px;
}

.nw-icon {
  font-size: 1rem;
  line-height: 1;
}

.nw-select {
  padding: var(--nw-space-sm) var(--nw-space-md);
  font-family: var(--nw-font-primary);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--nw-neutral-300);
  border-radius: var(--nw-radius-md);
  background: white;
  color: var(--nw-neutral-800);
  cursor: pointer;
  transition: all var(--nw-transition-fast);
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  padding-right: 30px;
}

.nw-select:hover {
  border-color: var(--nw-neutral-400);
}

.nw-select:focus {
  outline: none;
  border-color: var(--nw-primary);
  box-shadow: 0 0 0 3px rgba(26, 35, 50, 0.1);
}
</style>