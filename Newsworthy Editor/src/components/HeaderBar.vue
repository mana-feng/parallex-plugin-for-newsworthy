<template>
    <header class="header-bar">
        <div class="header-left">
            <button class="home-btn" @click="handleReturnHome" title="Return to initial empty page">
                ⌂ Home
            </button>

            <!-- Device selector -->
            <select v-model="store.selectedDeviceId" @change="store.selectDevice(store.selectedDeviceId)"
                class="device-select">
                <option value="pc">PC</option>
                <option value="tablet">Tablet (768px)</option>
                <option value="mobile">Mobile (375px)</option>
            </select>
        </div>
        <h1 class="header-title">
            Immersive Long Form Multimedia Article Editor
            <span v-if="store.currentPageInfo.isLoaded" class="editing-indicator">
                (Editing: {{ store.currentPageInfo.title }})
            </span>
        </h1>
        <div class="actions">
            <UpdateButton v-if="store.currentPageInfo.isLoaded" :disabled="store.sections.length === 0" />
            <SaveButton :disabled="store.sections.length === 0" />
            <button class="preview-btn" @click="store.togglePreview">👁 Preview</button>
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
    background-color: #f3f4f6;
    color: #111111;
    padding: 16px 24px;
    border-bottom: 1px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
}

.header-left {
    display: flex;
    align-items: center;
    min-width: 120px;
    gap: 8px;
}

.header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0;
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-family: Georgia, "Times New Roman", Times, serif;
}

.editing-indicator {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.8;
    font-style: italic;
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview-btn,
.home-btn {
    position: relative;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #111111;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    overflow: hidden;
}

.preview-btn:hover,
.home-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(17,17,17,0.08);
}

.preview-btn:active,
.home-btn:active {
    background: #f3f4f6;
}

.preview-btn {
    color: #b45309;
    border-color: #f59e0b;
}

.preview-btn:hover {
    background: #f59e0b;
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
}

.home-btn {
    color: #374151;
    border-color: #6b7280;
}

.home-btn:hover {
    background: #6b7280;
    color: #ffffff;
    box-shadow: 0 6px 16px rgba(107, 114, 128, 0.25);
}

.preview-btn::after,
.home-btn::after {
    content: "";
    position: absolute;
    top: 0;
    left: -40%;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-20deg);
    transition: left 0.5s ease;
}

.preview-btn:hover::after,
.home-btn:hover::after {
    left: 120%;
}

.device-select {
    margin-left: 12px;
    padding: 7px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #111111;
    background: #ffffff;
    border: 1px solid #6b7280;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    appearance: none;
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;
    padding-right: 30px;
}

.device-select:hover {
    background: #f9fafb;
    border-color: #374151;
}

.device-select:active {
    background: #f3f4f6;
}
</style>