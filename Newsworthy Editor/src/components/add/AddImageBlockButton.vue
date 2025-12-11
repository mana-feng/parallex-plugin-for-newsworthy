<template>
  <button class="btn" @click="handleAddImage" :disabled="disabled">
    + Add Image Block
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
.btn {
  position: relative;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d97706;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
  text-align: left;
  box-shadow: 0 1px 0 rgba(217, 119, 6, 0.15);
  overflow: hidden;
}

.btn:hover:not(:disabled) {
  background-color: #fef3c7;
  box-shadow: 0 6px 16px rgba(217, 119, 6, 0.20);
  transform: translateY(-1px);
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
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
  transform: skewX(-20deg);
  transition: left 0.5s ease;
}

.btn:hover::after { left: 120%; }
</style>

