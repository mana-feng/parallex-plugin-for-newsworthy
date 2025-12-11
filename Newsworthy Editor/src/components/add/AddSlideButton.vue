<template>
  <button class="add-slide-btn" @click.stop="handleClick">
    + Add Slide
  </button>
</template>

<script setup>
import * as parallaxService from '@/services/parallaxService'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const handleClick = () => {
  parallaxService.addSlide(props.section)
}
</script>

<style scoped>
.add-slide-btn {
  padding: 6px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.add-slide-btn:hover {
  background: #45a049;
}
</style>

