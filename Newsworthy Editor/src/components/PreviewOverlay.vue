<template>
    <div class="preview-mask" @click.self="$emit('exit')">
        <div class="toolbar">
            <button @click="$emit('exit')">Exit</button>
            <select v-model="selectedId">
                <option v-for="d in store.devices" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <button @click="exportHtml">Output HTML</button>
        </div>

        <div class="viewport">
            <div class="device-shell" :style="shellStyle">
                <iframe class="device-iframe" :srcdoc="htmlForIframe"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'

const props = defineProps({
    html: { type: String, required: true },
})

const emit = defineEmits(['exit'])
const store = useEditorStore()
const selectedId = computed({
    get: () => store.selectedDeviceId,
    set: (id) => store.selectDevice(id)
})

const htmlForIframe = computed(() => {
    const mode = store.currentDevice.mode
    const caps = {
        pc: '75ch',
        tablet: '55ch',
        mobile: '100%',
    }
    const css = `:root{ --device-text-max: ${caps[mode] || '65ch'}; }`
    return props.html.includes('</head>')
        ? props.html.replace('</head>', `<style id="device-overrides">${css}</style></head>`)
        : `<style id="device-overrides">${css}</style>` + props.html
})

const shellStyle = computed(() => {
    const { w, mode } = store.currentDevice
    if (mode === 'pc') {
        return {
            width: '100%',
            height: '100%',
            transform: 'none',
            boxShadow: 'none',
            borderRadius: '0',
            background: 'transparent',
            padding: '0',
        }
    }
    return {
        width: w + 'px',
        height: '100vh',
        transform: 'none',
        boxShadow: '0 12px 48px rgba(0,0,0,.45)',
        borderRadius: '16px',
        background: '#000',
        padding: '18px',
    }
})

function exportHtml() {
  const content = props.html
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'preview.html'
  a.click()
  URL.revokeObjectURL(url)
}

</script>

<style scoped>
.preview-mask {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 8px;
    background: #0b0e14e6;
}

.toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px;
    background: #11141a;
    color: #e5e7eb;
    border-bottom: 1px solid #222;
}

.viewport {
    position: relative;
    background: #0f131a;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
}

.device-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
    border-radius: 12px;
    display: block;
}
</style>
