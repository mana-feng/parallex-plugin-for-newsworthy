<template>
  <button class="nw-sidebar-btn nw-sidebar-btn-sm nw-sidebar-btn-secondary" @click.stop="handleClick">
    <span class="btn-icon">📝</span>
    <span>Add Text</span>
  </button>
</template>

<script setup>
import * as parallaxService from '@/services/parallaxService'

const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  slideIndex: {
    type: Number,
    required: true
  }
})

const handleClick = () => {
  parallaxService.addTextToSlide(props.section, props.slideIndex)
}
</script>

<style scoped>
.nw-sidebar-btn {
  /* Additional specific styles for slide text buttons */
}

.btn-icon {
  margin-right: 4px;
  font-weight: bold;
}
</style>

