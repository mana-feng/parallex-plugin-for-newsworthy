<template>
  <div class="parallax-section-editor"
    :class="{ 'checked': store.selected?.type === 'parallax' && store.selected?.sectionId === section.id }" @click.stop>

    <div class="parallax-header">
      <h3>⇅ Parallax Section (Scrollytelling)</h3>
      <div class="header-actions">
        <button class="delete-section-btn" @click.stop="
          store.selected = {
            type: 'parallax-section',
            sectionId: section.id
          };
        store.deleteSelected();
        ">
          ✖
        </button>
      </div>
    </div>

    <div class="slides-container">
      <div v-for="(slide, index) in section.slides" :key="slide.id" class="slide-item">
        <div class="slide-header">
          <h4>Slide {{ index + 1 }}</h4>
          <div class="slide-actions">
            <button v-if="section.slides.length > 1" @click.stop="removeSlide(index)"
              class="remove-slide-btn">×</button>
          </div>
        </div>

        <div class="slide-bg-control">
          <label>Background Image:</label>
          <div class="bg-input-group">
            <input type="text" v-model="slide.bgImg" placeholder="Enter image URL or upload"
              @input="updateSlideBg(index, $event.target.value)" />
            <label class="upload-btn">
              ⬆ Upload
              <input type="file" accept="image/*" @change="handleUploadBg(index, $event)" style="display: none;" />
            </label>
          </div>
          <div v-if="slide.bgImg" class="bg-preview">
            <img :src="getSlideBgDisplayUrl(slide.bgImg, index)" alt="Background preview" />
          </div>
        </div>

        <div class="slide-content">
          <div class="content-header">
            <label>Content:</label>
            <AddTextToSlideButton :section="section" :slideIndex="index" />
          </div>

          <div v-for="blk in slide.blocks" :key="blk.id" class="content-block"
            :class="{ 'block-checked': store.selected?.blockId === blk.id }"
            @click.stop="selectSlideBlock(slide.id, blk.id, index)">

            <div v-if="blk.type === 'text'" class="text-wrapper">
              <TipTapBlock v-model="blk.html" @focused="(ed) => {
                selectSlideBlock(slide.id, blk.id, index);
                store.setActiveEditor(ed);
              }" />
            </div>

            <button @click.stop="removeBlockFromSlide(index, blk.id)" class="remove-block-btn">×</button>
          </div>
        </div>
      </div>
    </div>
    <div class="add-slide-wrapper">
      <button class="add-slide-btn" @click.stop="parallaxService.addSlide(section)">➕ Add Slide</button>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../stores/editorStore'
import TipTapBlock from './TipTapBlock.vue'
import * as parallaxService from '@/services/parallaxService'
import { localToLocalhost } from '@/utils/imageUrlUtils'
// import { ref, watch } from 'vue'
import AddSlideButton from './add/AddSlideButton.vue'
import AddTextToSlideButton from './add/AddTextToSlideButton.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const store = useEditorStore()

// Function to get display URL for slide background images (local:// format)
function getSlideBgDisplayUrl(url, slideIndex) {
  if (!url || typeof url !== 'string') return url

  // For local:// URLs, convert synchronously
  return localToLocalhost(url)
}

const removeSlide = (index) => {
  parallaxService.removeSlide(props.section, index)
}

const updateSlideBg = (index, url) => {
  parallaxService.updateSlideBg(props.section, index, url)
}

const handleUploadBg = async (index, event) => {
  const file = event.target.files?.[0]
  if (!file) return

  await parallaxService.handleUploadBg(props.section, index, file)
}

const removeBlockFromSlide = (slideIndex, blockId) => {
  parallaxService.removeBlockFromSlide(props.section, slideIndex, blockId)
}

const selectSlideBlock = (slideId, blockId, slideIndex) => {
  store.selected = {
    type: 'text',
    sectionId: props.section.id,
    blockId: blockId,
    imageIndex: null,
    part: { slideIndex }
  }
}

</script>

<style scoped>
.parallax-section-editor {
  border: 2px dashed #ccc;
  padding: 20px;
  margin: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.parallax-section-editor.checked {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.parallax-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

.parallax-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.add-slide-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.add-slide-btn:hover {
  background: #45a049;
}

.slides-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slide-item {
  border: 1px solid #ddd;
  padding: 15px;
  background: white;
  border-radius: 6px;
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.slide-header h4 {
  margin: 0;
  font-size: 16px;
  color: #555;
}

.slide-actions {
  display: flex;
  gap: 8px;
}

.remove-slide-btn {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.remove-slide-btn:hover {
  background: #da190b;
}

.slide-bg-control {
  margin-bottom: 15px;
}

.slide-bg-control label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.bg-input-group {
  display: flex;
  gap: 8px;
}

.bg-input-group input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.upload-btn {
  padding: 8px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.upload-btn:hover {
  background: #0b7dda;
}

.bg-preview {
  margin-top: 10px;
  max-width: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.bg-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.slide-content {
  margin-top: 15px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.content-header label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

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

.content-block {
  position: relative;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fafafa;
}

.content-block.block-checked {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.text-wrapper {
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.remove-block-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  padding: 0;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-block-btn:hover {
  background: #da190b;
}

.delete-section-btn {
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  padding: 4px 10px;
  cursor: pointer;
}

.delete-section-btn:hover {
  background: #d9363e;
}

.add-slide-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.add-slide-btn {
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 40px;
  padding: 8px 16px;
  font-size: 18px;
  cursor: pointer;
}

.add-slide-btn:hover {
  background: #45a049;
}
</style>
