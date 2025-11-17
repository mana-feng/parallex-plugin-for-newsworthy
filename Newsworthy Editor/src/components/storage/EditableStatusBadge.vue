<template>
  <span 
    :class="badgeClass" 
    :title="tooltip"
  >
    {{ icon }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { isEditableHtml } from '@/utils/parseHtml'

const props = defineProps({
  sectionsData: {
    type: [Object, Array, String],
    default: null
  },
  htmlContent: {
    type: String,
    default: null
  }
})

const status = computed(() => {
  if (props.sectionsData) {
    return 'editable'
  } else if (props.htmlContent && isEditableHtml(props.htmlContent)) {
    return 'convertible'
  } else {
    return 'metadata-only'
  }
})

const badgeClass = computed(() => {
  return {
    'editable-badge': status.value === 'editable',
    'convertible-badge': status.value === 'convertible',
    'metadata-only-badge': status.value === 'metadata-only'
  }
})

const icon = computed(() => {
  switch (status.value) {
    case 'editable':
      return '✨'
    case 'convertible':
      return '🔄'
    default:
      return '📝'
  }
})

const tooltip = computed(() => {
  switch (status.value) {
    case 'editable':
      return 'Fully Editable'
    case 'convertible':
      return 'Convertible to Editable'
    default:
      return 'Metadata Only'
  }
})
</script>

<style scoped>
.editable-badge,
.convertible-badge,
.metadata-only-badge {
  font-size: 0.8em;
  margin-left: 6px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.editable-badge:hover,
.convertible-badge:hover,
.metadata-only-badge:hover {
  opacity: 1;
}

.editable-badge {
  /* Fully editable - has sections_data */
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.5));
}

.convertible-badge {
  /* Can be converted from HTML */
  filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5));
}

.metadata-only-badge {
  /* Metadata only - cannot load into editor */
  filter: drop-shadow(0 0 2px rgba(156, 163, 175, 0.5));
}
</style>

