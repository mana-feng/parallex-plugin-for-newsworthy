<template>
  <button 
    class="nw-btn nw-btn-secondary save-btn" 
    @click="handleClick"
    :disabled="disabled || isSaving"
  >
    <span class="nw-icon">{{ isSaving ? '⏳' : '💾' }}</span>
    <span>{{ isSaving ? 'Saving...' : 'Save New' }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import * as dialog from '@/utils/dialog'
import { promptPageInfo } from '@/utils/inputModal'
import { saveNewPage } from '@/processes/html-save'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['saved', 'error'])

const store = useEditorStore()
const isSaving = ref(false)

const handleClick = async () => {
  if (isSaving.value) return
  
  if (store.sections.length === 0) {
    await dialog.warning('Please add content before saving.\n\nAdd at least one section to your page.', {
      title: 'No Content',
      icon: '⚠️'
    })
    return
  }

  const pageInfo = await promptPageInfo('My Page')
  if (!pageInfo) {
    return
  }

  const title = pageInfo.title
  const filename = pageInfo.filename

  isSaving.value = true

  try {
    // Use the new saveNewPage flow function
    const result = await saveNewPage({
      title,
      filename,
      sections: store.sections,
      generatePreviewImage: store.generatePreviewImage,
      collectLocalImageIds: store.collectLocalImageIds
    })

    if (result.ok) {
      emit('saved', result.data)
    } else {
      if (!result.cancelled) {
        emit('error', result.error)
      }
    }
  } catch (error) {
    console.error('Save page error:', error)
    emit('error', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.save-btn {
  /* Additional styles for save button if needed */
}
</style>

