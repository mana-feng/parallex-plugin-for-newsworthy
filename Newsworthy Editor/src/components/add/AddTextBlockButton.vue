<template>
  <button class="nw-sidebar-btn nw-sidebar-btn-secondary" @click="handleClick" :disabled="disabled">
    <span class="btn-icon">📝</span>
    <span>Add Text Block</span>
  </button>
</template>

<script setup>
import { useEditorStore } from '@/stores/editorStore'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const store = useEditorStore()

const handleClick = () => {
  store.addTextBlock()
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for text block button */
}

.btn-icon {
  margin-right: 8px;
  font-weight: bold;
}
</style>

