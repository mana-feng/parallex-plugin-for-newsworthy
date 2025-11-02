<template>
  <div id="app-root" style="width: 100%; height: 100vh;">
    <Editor />
    <InputModal ref="inputModalRef" />
    <CustomDialog ref="customDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Editor from './components/VisualEditor.vue'
import InputModal from './components/InputModal.vue'
import CustomDialog from './components/CustomDialog.vue'
import { setInputModalInstance } from './utils/inputModal'
import { registerDialog } from './utils/dialog'

const inputModalRef = ref(null)
const customDialogRef = ref(null)

onMounted(() => {
  // Initialize global modal instance
  if (inputModalRef.value) {
    setInputModalInstance(inputModalRef.value)
  } else {
    console.error('❌ InputModal ref is null!')
  }
  
  // Initialize global dialog instance
  if (customDialogRef.value) {
    registerDialog(customDialogRef.value)
  } else {
    console.error('❌ CustomDialog ref is null!')
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
