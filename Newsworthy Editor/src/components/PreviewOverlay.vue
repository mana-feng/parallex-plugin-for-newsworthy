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
                <iframe class="device-iframe" :src="iframeUrl"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'

const props = defineProps({
    html: { type: String, required: true },
})

const iframeUrl = ref('')

const emit = defineEmits(['exit'])
const store = useEditorStore()
const selectedId = computed({
    get: () => store.selectedDeviceId,
    set: (id) => store.selectDevice(id)
})

function updateIframe() {
    const mode = store.currentDevice.mode
    const caps = { pc: '75ch', tablet: '55ch', mobile: '100%' }

    const viewport =
        mode === 'pc'
            ? '<meta name="viewport" content="width=device-width, initial-scale=1">'
            : mode === 'tablet'
                ? '<meta name="viewport" content="width=768, initial-scale=1">'
                : '<meta name="viewport" content="width=375, initial-scale=1">'

    const css = `:root{ --device-text-max: ${caps[mode] || '65ch'}; }`

    const finalHtml = props.html.includes('</head>')
        ? props.html.replace(
            '</head>',
            `<style id="device-overrides">${css}</style>${viewport}</head>`
        )
        : `${viewport}<style id="device-overrides">${css}</style>` + props.html

    if (iframeUrl.value) URL.revokeObjectURL(iframeUrl.value)

    iframeUrl.value = '/preview-host.html'
    setTimeout(() => {
        const iframe = document.querySelector('.device-iframe');
        iframe?.contentWindow.postMessage({
            type: "render-html",
            payload: finalHtml
        }, '*');
    }, 100);

}

watch(() => store.currentDevice.mode, updateIframe, { immediate: true })
watch(() => props.html, updateIframe, { immediate: true })

onUnmounted(() => {
    if (iframeUrl.value) URL.revokeObjectURL(iframeUrl.value)
})

const shellStyle = computed(() => {
    const { mode, w } = store.currentDevice

    const deviceWidths = {
        pc: '100vw',
        tablet: '768px',
        mobile: '375px'
    }

    return {
        width: deviceWidths[mode] || '100vw',
        height: '100vh',
        border: 'none',
        margin: '0 auto',
        boxShadow: 'none',
        background: '#fff',
        display: 'block',
        transition: 'width 0.3s ease',
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
    background: rgba(255, 255, 255, 0.9);
}

/* top */
.toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: #f6d4d4;
    color: #333;
    border-bottom: 1px solid #dca4a4;
    font-size: 14px;
}

.toolbar button,
.toolbar select,
.toolbar input[type="range"] {
    border: 1px solid #dca4a4;
    border-radius: 8px;
    background: #ffffff;
    color: #b91c1c;
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease;
}

/* hover */
.toolbar button:hover,
.toolbar select:hover,
.toolbar input[type="range"]:hover {
    background: #fee2e2;
    border-color: #c77a7a;
}

/* select */
.toolbar select {
    appearance: none;
    padding-right: 24px;
}

/* slider */
.toolbar input[type="range"] {
    accent-color: #c77a7a;
    cursor: pointer;
}

/* viewport */
.viewport {
    position: relative;
    background: #fafafa;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

/* iframe */
.device-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
    display: block;
}
</style>
