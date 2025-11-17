<template>
  <button class="nw-sidebar-btn nw-sidebar-btn-accent" @click="handleAddImage" :disabled="disabled">
    <span class="btn-icon">🖼️</span>
    <span>Add Image Block</span>
  </button>
</template>

<script setup>
import { useEditorStore } from '@/stores/editorStore'
import { nextTick } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-image'])

const store = useEditorStore()

const handleAddImage = () => {
  emit('add-image')
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for image block button */
}

.btn-icon {
  margin-right: 8px;
  font-weight: bold;
}
</style>

