<template>
  <button class="nw-sidebar-btn nw-sidebar-btn-accent" @click="handleClick">
    <span class="btn-icon">🌄</span>
    <span>Add Parallax</span>
  </button>
</template>

<script setup>
const emit = defineEmits(['add'])

const handleClick = () => {
  emit('add')
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for parallax button */
}

.btn-icon {
  margin-right: 8px;
  font-weight: bold;
}
</style>

