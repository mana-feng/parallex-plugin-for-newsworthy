<template>
  <button class="nw-sidebar-btn nw-sidebar-btn-primary" @click="handleClick" :disabled="disabled">
    <span class="btn-icon">📄</span>
    <span>Add New Section</span>
  </button>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add'])

const handleClick = () => {
  emit('add')
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for section button */
}

.btn-icon {
  margin-right: 8px;
  font-weight: bold;
}
</style>

