<template>
  <button 
    class="save-btn" 
    @click="handleClick"
    :disabled="disabled || isSaving"
  >
    {{ isSaving ? '⏳ Saving...' : '+ Save New' }}
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
  position: relative;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #166534;
  background: #ffffff;
  border: 1px solid #16a34a;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease;
  box-shadow: 0 1px 0 rgba(22, 163, 74, 0.1);
  overflow: hidden;
}

.save-btn:hover:not(:disabled) {
  background: #16a34a;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.25);
  transform: translateY(-1px);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.save-btn::after {
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

.save-btn:hover::after {
  left: 120%;
}

.save-btn:disabled {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}
</style>

