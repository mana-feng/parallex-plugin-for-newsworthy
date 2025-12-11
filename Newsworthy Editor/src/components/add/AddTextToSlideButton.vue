<template>
  <button class="add-content-btn" @click.stop="handleClick">
    + Add Text
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
.add-content-btn {
  padding: 6px 12px;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.add-content-btn:hover {
  background: #e68900;
}
</style>

