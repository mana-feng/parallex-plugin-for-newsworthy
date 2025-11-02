<template>
  <div class="parallax-section-editor"
    :class="{ 'checked': store.selected?.type === 'parallax' && store.selected?.sectionId === section.id }"
    @click.stop="store.selectSection(section.id)">
    
    <div class="parallax-header">
      <h3>⇅ Parallax Section (Scrollytelling)</h3>
      <button class="add-slide-btn" @click.stop="addSlide">+ Add Slide</button>
    </div>

    <div class="slides-container">
      <div v-for="(slide, index) in section.slides" :key="slide.id" class="slide-item">
        <div class="slide-header">
          <h4>Slide {{ index + 1 }}</h4>
          <div class="slide-actions">
            <button v-if="section.slides.length > 1" @click.stop="removeSlide(index)" class="remove-slide-btn">×</button>
          </div>
        </div>

        <div class="slide-bg-control">
          <label>Background Image:</label>
          <div class="bg-input-group">
            <input 
              type="text" 
              v-model="slide.bgImg" 
              placeholder="Enter image URL or upload"
              @input="updateSlideBg(index, $event.target.value)"
            />
            <label class="upload-btn">
              ⬆ Upload
              <input 
                type="file" 
                accept="image/*" 
                @change="handleUploadBg(index, $event)"
                style="display: none;"
              />
            </label>
          </div>
          <div v-if="slide.bgImg" class="bg-preview">
            <img :src="slide.bgImg" alt="Background preview" />
          </div>
        </div>

        <div class="slide-content">
          <div class="content-header">
            <label>Content:</label>
            <button @click.stop="addTextToSlide(index)" class="add-content-btn">+ Add Text</button>
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
  </div>
</template>

<script setup>
import { useEditorStore } from '../stores/editorStore'
import TipTapBlock from './TipTapBlock.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const store = useEditorStore()

const addSlide = () => {
  props.section.slides.push({
    id: Date.now(),
    bgImg: '',
    sourceType: 'url',
    _blobUrl: '',
    blocks: []
  })
}

const removeSlide = (index) => {
  if (props.section.slides.length <= 1) return
  
  // Revoke blob URL if exists
  const slide = props.section.slides[index]
  if (slide._blobUrl && slide._blobUrl.startsWith('blob:')) {
    try { URL.revokeObjectURL(slide._blobUrl) } catch { }
  }
  
  props.section.slides.splice(index, 1)
}

const updateSlideBg = (index, url) => {
  const slide = props.section.slides[index]
  if (!slide) return
  
  slide.bgImg = url
  slide.sourceType = 'url'
}

const handleUploadBg = async (index, event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  const slide = props.section.slides[index]
  if (!slide) return
  
  // Revoke old blob URL
  if (slide._blobUrl && slide._blobUrl.startsWith('blob:')) {
    try { URL.revokeObjectURL(slide._blobUrl) } catch { }
  }
  
  try {
    // Read file as data URL
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      
      try {
        // Save to local database first (for preview)
        const response = await fetch('http://localhost:3001/api/images/temp/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageData: dataUrl,
            filename: file.name
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save image to local database')
        }
        
        const result = await response.json()
        
        // Use local URL for preview (will be uploaded to GitHub on publish)
        slide.bgImg = result.localUrl
        slide.sourceType = 'local'
        slide._blobUrl = ''
        console.log(`Parallax background saved locally: ${result.localUrl}`)
      } catch (saveError) {
        console.error('Local save failed:', saveError)
        // Fallback: use data URL directly
        slide.bgImg = dataUrl
        slide.sourceType = 'upload'
        slide._blobUrl = dataUrl
      }
    }
    
    reader.onerror = () => {
      // Fallback: use blob URL if reading fails
      const blobUrl = URL.createObjectURL(file)
      slide.bgImg = blobUrl
      slide.sourceType = 'upload'
      slide._blobUrl = blobUrl
    }
    
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Parallax background upload error:', error)
    // Fallback: use blob URL
    const blobUrl = URL.createObjectURL(file)
    slide.bgImg = blobUrl
    slide.sourceType = 'upload'
    slide._blobUrl = blobUrl
  }
}

const addTextToSlide = (slideIndex) => {
  const slide = props.section.slides[slideIndex]
  if (!slide) return
  
  slide.blocks.push({
    id: Date.now(),
    type: 'text',
    html: '<p>Enter your text here...</p>',
  })
}

const removeBlockFromSlide = (slideIndex, blockId) => {
  const slide = props.section.slides[slideIndex]
  if (!slide) return
  
  slide.blocks = slide.blocks.filter(b => b.id !== blockId)
}

const selectSlideBlock = (slideId, blockId, slideIndex) => {
  store.selected = {
    type: 'parallax-block',
    sectionId: props.section.id,
    slideId: slideId,
    slideIndex: slideIndex,
    blockId: blockId
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
</style>

