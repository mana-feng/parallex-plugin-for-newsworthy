<template>
  <span 
    :class="['sync-badge', statusClass]" 
    :title="tooltip"
  >
    {{ icon }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  syncStatus: {
    type: String,
    default: 'local-only' // 'synced' | 'local-only' | 'cloud-only' | 'out-of-sync'
  }
})

const statusClass = computed(() => {
  if (props.syncStatus === 'synced') {
    return 'synced';
  } else if (props.syncStatus === 'cloud-only') {
    return 'cloud-only';
  } else if (props.syncStatus === 'out-of-sync') {
    return 'out-of-sync';
  } else {
    return 'local-only';
  }
})

const icon = computed(() => {
  switch (props.syncStatus) {
    case 'synced':
      return '☁️';
    case 'out-of-sync':
      return '⚠️';
    case 'cloud-only':
      return '☁️';
    default:
      return '💾';
  }
})

const tooltip = computed(() => {
  switch (props.syncStatus) {
    case 'synced':
      return 'Synced: Local + Cloud'
    case 'out-of-sync':
      return 'Local Updated: Needs Upload to Cloud'
    case 'cloud-only':
      return 'Cloud Only'
    default:
      return 'Local Only'
  }
})
</script>

<style scoped>
.sync-badge {
  font-size: 0.9em;
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s;
  cursor: help;
}

.sync-badge.synced {
  /* Synced to cloud - both local and cloud */
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.6));
}

.sync-badge.synced:hover {
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.9));
  transform: scale(1.1);
}

.sync-badge.local-only {
  /* Local only - not synced to cloud */
  filter: drop-shadow(0 0 3px rgba(234, 179, 8, 0.6));
  opacity: 0.85;
}

.sync-badge.local-only:hover {
  filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.9));
  transform: scale(1.1);
  opacity: 1;
}

.sync-badge.cloud-only {
  /* Cloud only - not in local database (future use) */
  filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.6));
  opacity: 0.85;
}

.sync-badge.cloud-only:hover {
  filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.9));
  transform: scale(1.1);
  opacity: 1;
}

.sync-badge.out-of-sync {
  /* Out of sync - local updated but not uploaded */
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.6));
  opacity: 0.9;
}

.sync-badge.out-of-sync:hover {
  filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.9));
  transform: scale(1.1);
  opacity: 1;
}
</style>

