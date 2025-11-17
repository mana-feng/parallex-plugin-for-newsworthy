<template>
  <div class="canvas-wrapper">
    <main class="canvas-area" :style="{ width: store.currentDevice?.w ? store.currentDevice.w + 'px' : '100%' }"
      ref="canvasRef" @click="store.notSelected">
      <template v-for="section in store.sections" :key="section.id">
        <!-- Parallax Section -->
        <ParallaxSection v-if="section.type === 'parallax'" :section="section" />

        <!-- Normal Section -->
        <div v-else class="section-block"
          :class="{ 'checked': store.selected?.type === 'section' && store.selected?.sectionId === section.id }"
          :style="sectionStyle(section.props)" @click.stop="store.selectSection(section.id)">
          <div v-if="store.selected && store.selected.sectionId === section.id" class="floating-tools" @click.stop>
            <template v-if="store.selected.type === 'section'">
              <div class="tool-group">
                <span class="tool-label">BG</span>
                <input type="color" v-model="bgColorProxy" />
              </div>
              <div class="tool-group">
                <span class="tool-label">H</span>
                <input type="number" min="200" :value="store.currSection?.props.height || 800"
                  @input="store.setSecHeight($event.target.value)" style="width:90px" />
              </div>
              <button class="nw-sidebar-btn nw-sidebar-btn-danger" @click="store.deleteSelected">
                <span class="btn-icon">🗑️</span>
                Delete
              </button>
            </template>

            <template v-else-if="store.selected.type === 'text'">
              <div class="tool-group">
                <div class="nw-segmented-control">
                  <button class="nw-segment" title="Title" aria-label="Title"
                    :class="{ active: store.activeEditor?.isActive('heading', { level: 1 }) }" @click="setHeading(1)">
                    <span class="segment-icon">T</span>
                  </button>
                  <button class="nw-segment" title="Subtitle" aria-label="Subtitle"
                    :class="{ active: store.activeEditor?.isActive('heading', { level: 2 }) }" @click="setHeading(2)">
                    <span class="segment-icon">S</span>
                  </button>
                  <button class="nw-segment" title="Body" aria-label="Body" :class="{
                    active:
                      !store.activeEditor?.isActive('heading', { level: 1 }) &&
                      !store.activeEditor?.isActive('heading', { level: 2 })
                  }" @click="setParagraph">
                    <span class="segment-icon">B</span>
                  </button>
                </div>
              </div>

              <div class="tool-group">
                <span class="tool-label">Font</span>
                <select @change="setFontFamily($event.target.value || null)" style="width:160px">
                  <option value="">Default</option>
                  <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                  <option value='Georgia, "Times New Roman", Times, serif'>Georgia</option>
                  <option value='Calibri, "Segoe UI", Roboto, Arial, Helvetica, sans-serif'>Calibri</option>
                  <option value='Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Inter</option>
                  <option value='Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Roboto</option>
                  <option value='Arial, "Helvetica Neue", Helvetica, sans-serif'>Arial</option>
                  <option value='"Helvetica Neue", Helvetica, Arial, sans-serif'>Helvetica Neue</option>
                  <option value='"Courier New", Courier, monospace'>Courier New</option>
                  <option value='ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'>Serif</option>
                  <option
                    value='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'>
                    Sans-serif</option>
                  <option
                    value='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>
                    Monospace</option>
                </select>
              </div>

              <div class="tool-group">
                <span class="tool-label">Size</span>
                <select v-model="currentFontSize" @change="setFontSize($event.target.value || null)" style="width:90px">
                  <option value="">Default</option>
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="18px">18</option>
                  <option value="20px">20</option>
                  <option value="24px">24</option>
                  <option value="28px">28</option>
                  <option value="32px">32</option>
                  <option value="36px">36</option>
                  <option value="48px">48</option>
                </select>
              </div>

              <div class="tool-group">
                <span class="tool-label">Align</span>
                <div class="nw-segmented-control">
                  <button class="nw-segment" title="Left" aria-label="Left" :class="{ active: isActiveAlign('left') }"
                    @click="setAlign('left')">
                    <span class="segment-icon">⬅️</span>
                  </button>
                  <button class="nw-segment" title="Center" aria-label="Center"
                    :class="{ active: isActiveAlign('center') }" @click="setAlign('center')">
                    <span class="segment-icon">⬆️</span>
                  </button>
                </div>
              </div>

              <div class="tool-group">
                <div class="nw-segmented-control">
                  <button class="nw-segment" title="Bold" aria-label="Bold"
                    :class="{ active: store.activeEditor?.isActive('bold') }" @click="toggleBold">
                    <span class="segment-icon">B</span>
                  </button>
                  <button class="nw-segment" title="Italic" aria-label="Italic"
                    :class="{ active: store.activeEditor?.isActive('italic') }" @click="toggleItalic">
                    <span class="segment-icon">I</span>
                  </button>
                  <button class="nw-segment" title="Drop Cap" @click="toggleDropCap">
                    <span class="segment-icon">📝</span>
                  </button>
                </div>
              </div>

              <div class="tool-group" style="width:160px">
                <span class="tool-label">Width</span>
                <input type="range" min="30" max="120" step="1" :value="textWidthValueCh"
                  @input="onWidthSlider($event.target.value)" />
              </div>

              <div class="tool-group">
                <span class="tool-label">Color</span>
                <input type="color" v-model="textColor" @input="applyColor" class="nw-color-picker" />
              </div>

              <div class="tool-group">
                <button class="nw-sidebar-btn nw-sidebar-btn-secondary" title="Insert Link" @click="setLink">
                  <span class="btn-icon">🔗</span>
                  Link
                </button>
                <button class="nw-sidebar-btn nw-sidebar-btn-secondary" title="Remove Link" @click="unsetLink">
                  <span class="btn-icon">❌</span>
                  Unlink
                </button>
              </div>

              <div class="tool-group">
                <button class="nw-sidebar-btn nw-sidebar-btn-danger" @click="store.deleteSelected">Delete</button>
              </div>
            </template>

            <template v-else-if="store.selected.type === 'image'">
              <ImageSettingsPanel :model="store.currImage" title="Image Settings"
                @updateWidth="store.setImgWidth" @updateHeight="store.setImgHeight" @updateKeepRatio="store.setImgKeepRatio"
                @updateCaption="store.setImgCaption" @updateCaptionPosition="store.setImgCaptionPosition"
                @updateCaptionBubbleAnimated="store.setImgCaptionBubbleAnimated" @replaceImage="replaceImage"
                @deleteImage="store.deleteSelected" />
            </template>

            <template v-else-if="store.selected.type === 'fullwidth-image'">
              <ImageSettingsPanel :model="{ image: store.currBlock?.image }" title="Full-Width Image Settings"
                @updateMode="store.setFullWidthImgMode" @updateHeight="store.setFullWidthImgHeight"
                @updateCaption="store.setFullWidthImgCaption" @updateCaptionPosition="store.setFullWidthImgCaptionPosition"
                @updateCaptionBubbleAnimated="store.setFullWidthImgCaptionBubbleAnimated" @replaceImage="replaceImage"
                @deleteImage="store.deleteSelected" />
            </template>

            <template v-else-if="store.selected.type === 'float-image'">
              <template v-if="store.selected.part === 'image'">
                <div class="tool-group">
                  <span class="tool-label">Align</span>
                  <select :value="store.currBlock?.image?.align || 'right'"
                    @change="e => store.setFloatImgAlign(e.target.value)">
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div class="tool-group" style="width:200px">
                  <span class="tool-label">Width</span>
                  <input type="range" min="20" max="70" step="1" :value="store.currBlock?.image?.widthPercent ?? 45"
                    @input="e => store.setFloatImgWidth(Number(e.target.value))" />
                </div>
                <div class="tool-group" style="width:220px">
                  <span class="tool-label">Caption</span>
                  <input type="text" placeholder="Enter caption (optional)…" :value="store.currBlock?.image?.caption || ''"
                    @input="e => store.setFloatImgCaption(e.target.value)" />
                </div>
                <div class="tool-group">
                  <span class="tool-label">Position</span>
                  <select :value="store.currBlock?.image?.captionPosition || 'bottom'"
                    @change="e => store.setFloatImgCaptionPosition(e.target.value)">
                    <option value="bottom">Bottom</option>
                    <option value="bubble">Bubble</option>
                  </select>
                </div>
                <div class="tool-group" v-if="store.currBlock?.image?.captionPosition === 'bubble'">
                  <label class="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" :checked="!!store.currBlock?.image?.captionBubbleAnimated"
                      @change="e => store.setFloatImgCaptionBubbleAnimated(e.target.checked)" />
                    Animate
                  </label>
                </div>
                <div class="tool-group">
                  <button class="nw-sidebar-btn nw-sidebar-btn-secondary" @click="replaceImage">
                    <span class="btn-icon">🔄</span>
                    Replace
                  </button>
                  <button class="nw-sidebar-btn nw-sidebar-btn-danger" @click="store.deleteSelected">
                    <span class="btn-icon">🗑️</span>
                    Delete
                  </button>
                </div>
              </template>
              <template v-else-if="store.selected.part === 'text'">
                <div class="tool-group">
                  <div class="nw-segmented-control">
                    <button class="nw-segment" title="Title" aria-label="Title"
                      :class="{ active: store.activeEditor?.isActive('heading', { level: 1 }) }" @click="setHeading(1)">
                      <span class="segment-icon">T</span>
                    </button>
                    <button class="nw-segment" title="Subtitle" aria-label="Subtitle"
                      :class="{ active: store.activeEditor?.isActive('heading', { level: 2 }) }" @click="setHeading(2)">
                      <span class="segment-icon">S</span>
                    </button>
                    <button class="nw-segment" title="Body" aria-label="Body" :class="{
                      active:
                        !store.activeEditor?.isActive('heading', { level: 1 }) &&
                        !store.activeEditor?.isActive('heading', { level: 2 })
                    }" @click="setParagraph">
                      <span class="segment-icon">B</span>
                    </button>
                  </div>
                </div>
                <div class="tool-group">
                  <span class="tool-label">Font</span>
                  <select @change="setFontFamily($event.target.value || null)" style="width:160px">
                    <option value="">Default</option>
                    <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                    <option value='Georgia, "Times New Roman", Times, serif'>Georgia</option>
                    <option value='Calibri, "Segoe UI", Roboto, Arial, Helvetica, sans-serif'>Calibri</option>
                    <option value='Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Inter</option>
                    <option value='Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'>Roboto</option>
                    <option value='Arial, "Helvetica Neue", Helvetica, sans-serif'>Arial</option>
                    <option value='"Helvetica Neue", Helvetica, Arial, sans-serif'>Helvetica Neue</option>
                    <option value='"Courier New", Courier, monospace'>Courier New</option>
                    <option value='ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'>Serif</option>
                    <option
                      value='ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"'>
                      Sans-serif</option>
                    <option
                      value='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>
                      Monospace</option>
                  </select>
                </div>
                <div class="tool-group">
                  <span class="tool-label">Align</span>
                  <div class="nw-segmented-control">
                    <button class="nw-segment" title="Left" aria-label="Left" :class="{ active: isActiveAlign('left') }"
                      @click="setAlign('left')">
                      <span class="segment-icon">⬅️</span>
                    </button>
                    <button class="nw-segment" title="Center" aria-label="Center"
                      :class="{ active: isActiveAlign('center') }" @click="setAlign('center')">
                      <span class="segment-icon">⬆️</span>
                    </button>
                  </div>
                </div>
                <div class="tool-group">
                  <span class="tool-label">Color</span>
                  <input type="color" v-model="textColor" @input="applyColor" class="nw-color-picker" />
                </div>
                <div class="tool-group">
                  <button class="nw-sidebar-btn nw-sidebar-btn-secondary" title="Insert Link" @click="setLink">
                    <span class="btn-icon">🔗</span>
                    Link
                  </button>
                  <button class="nw-sidebar-btn nw-sidebar-btn-secondary" title="Remove Link" @click="unsetLink">
                    <span class="btn-icon">❌</span>
                    Unlink
                  </button>
                </div>
                <div class="tool-group">
                  <button class="nw-sidebar-btn nw-sidebar-btn-danger" @click="store.deleteSelected">Delete</button>
                </div>
              </template>
              <template v-else>
                <div class="tool-group">
                  Click the image or text area to edit its settings.
                </div>
              </template>
            </template>

            <template v-else-if="store.selected.type === 'video'">
              <div class="tool-group" style="width:260px">
                <span class="tool-label">URL</span>
                <input type="text" :value="store.currBlock?.url || ''" @input="store.setVideoUrl($event.target.value)"
                  placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div class="tool-group" style="width:200px">
                <span class="tool-label">W</span>
                <input type="range" min="200" max="1200" step="10" :value="store.currBlock?.width || 560"
                  @input="onWidthChange($event.target.value)" />
              </div>
              <div class="tool-group" style="width:200px">
                <span class="tool-label">H</span>
                <input type="range" min="150" max="1000" step="10" :value="store.currBlock?.height || 315"
                  :disabled="store.currBlock?.keepRatio" @input="store.setVideoHeight($event.target.value)" />
              </div>
              <div class="tool-group">
                <label>
                  <input type="checkbox" :checked="store.currBlock?.keepRatio" @change="onToggleRatio($event.target.checked)" />
                  Keep 16:9
                </label>
              </div>
              <div class="tool-group">
                <button class="nw-sidebar-btn nw-sidebar-btn-danger" @click="store.deleteSelected">Delete Video</button>
              </div>
            </template>
          </div>
          <div v-for="blk in section.blocks" :key="blk.id" class="block-wrapper"
            :class="{ 
              'block-checked': store.selected?.type === blk.type && store.selected?.blockId === blk.id,
              'fullwidth-wrapper': blk.type === 'fullwidth-image'
            }"
            @click.stop="store.selectBlock(section.id, blk.id, blk.type)">
            <div v-if="blk.type === 'text'" class="text-wrapper"
              :style="{ maxWidth: blk.props?.width || '65ch', width: '100%', margin: '0 auto' }">
              <TipTapBlock v-model="blk.html" @focused="(ed) => {
                store.selectBlock(section.id, blk.id, blk.type);
                store.setActiveEditor(ed);
              }" />
            </div>

            <figure v-else-if="blk.type === 'image'" class="image-block">
              <div class="image-grid">
                <div v-for="(img, i) in (Array.isArray(blk.images) ? blk.images : [blk])" :key="img.id || i"
                  class="image-cell" :class="{
                    'image-selected':
                      store.selected?.type === 'image' &&
                      store.selected?.blockId === blk.id &&
                      store.selected?.imageIndex === i,
                    // 'caption-right': img.captionPosition === 'right',
                    'caption-bubble': img.captionPosition === 'bubble',
                    'bubble-anim': img.captionPosition === 'bubble' && img.captionBubbleAnimated,
                  }" @click.stop="store.selectBlock(section.id, blk.id, 'image', i)">
                  <img :src="getImageDisplayUrl(img.src)" :style="{
                    width: (img.width || 300) + 'px',
                    height: (img.height || 300) + 'px',
                    objectFit: img.keepRatio ? 'contain' : 'fill',
                    objectPosition: 'center',
                    maxWidth: '100%'
                  }" />
                  <figcaption v-if="img.caption" class="image-caption">
                    {{ img.caption }}
                  </figcaption>
                </div>
              </div>
            </figure>

            <figure v-else-if="blk.type === 'fullwidth-image'" class="fullwidth-image-block" :class="{
              'caption-bubble': blk.image.captionPosition === 'bubble',
              'bubble-anim': blk.image.captionPosition === 'bubble' && blk.image.captionBubbleAnimated,
            }" @click.stop="store.selectBlock(section.id, blk.id, 'fullwidth-image')">
              <img :src="getImageDisplayUrl(blk.image.src)" class="fullwidth-image" :style="{
                width: '100%',
                display: 'block',
                objectFit: blk.image.mode === 'fixed' ? 'cover' : 'contain',
                height: blk.image.mode === 'fixed'
                  ? blk.image.height + 'px'
                  : 'auto',
              }" />
              <figcaption v-if="blk.image.caption" class="image-caption">
                {{ blk.image.caption }}
              </figcaption>
            </figure>

            <figure v-else-if="blk.type === 'float-image'" class="float-image-block" :class="{
              'caption-right': blk.image.captionPosition === 'right',
              'caption-bubble': blk.image.captionPosition === 'bubble',
              'bubble-anim': blk.image.captionPosition === 'bubble' && blk.image.captionBubbleAnimated,
            }" @click.self.stop="store.selectBlock(section.id, blk.id, 'float-image')">
              <div class="float-img-wrapper" :style="{
                width: blk.image.widthPercent + '%',
                float: blk.image.align,
                margin: blk.image.align === 'left' ? '0 16px 8px 0' : '0 0 8px 16px'
              }" @click.stop="store.selectBlock(section.id, blk.id, 'float-image', null, 'image')">
                <img :src="getImageDisplayUrl(blk.image.src)" />

                <figcaption v-if="blk.image.caption" class="image-caption">
                  {{ blk.image.caption }}
                </figcaption>
              </div>

              <div class="float-image-text" @click.stop>
                <TipTapBlock v-model="blk.text" @focused="(ed) => {
                  store.selectBlock(section.id, blk.id, 'float-image', null, 'text')
                  store.setActiveEditor(ed)
                }" />
              </div>
            </figure>

            <div v-else-if="blk.type === 'video'" class="video-block">
              <iframe :width="blk.width" :height="blk.height" :src="`https://www.youtube.com/embed/${blk.videoId}`"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen :style="{
                  maxWidth: '100%',
                  borderRadius: '4px'
                }"></iframe>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { useEditorStore } from '../stores/editorStore';
// eslint-disable-next-line no-unused-vars
import { defineComponent, onMounted, onBeforeUnmount, watch, h, shallowRef, ref, reactive, computed } from 'vue'
import { localToLocalhost } from '@/utils/imageUrlUtils'
import ParallaxSection from './ParallaxSection.vue'
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/vue-3';
import Paragraph from '@tiptap/extension-paragraph'
import ImageSettingsPanel from '@/components/ImageSettingsPanel.vue'
import { promptInput } from '@/utils/inputModal'

const store = useEditorStore()
const canvasRef = ref(null)
const curr = computed(() => store.currSection)
const textColor = ref('#000000')
const currentFontSize = ref('')

/**
 * Get display URL for image (localhost backend)
 * @param {string} url - Image URL (local://)
 * @returns {string} - Display URL
 */
function getImageDisplayUrl(url) {
  if (!url || typeof url !== 'string') return url

  // For local:// URLs, convert synchronously
  return localToLocalhost(url)
}

// TipTap Extensions
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: el => el.style.fontSize || null,
            renderHTML: attrs => {
              if (!attrs.fontSize) return {}
              return { style: `font-size: ${attrs.fontSize}` }
            }
          }
        }
      }
    ]
  }
})

const FontFamily = Extension.create({
  name: 'fontFamily',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: el => el.style.fontFamily || null,
            renderHTML: attrs => {
              if (!attrs.fontFamily) return {}
              return { style: `font-family: ${attrs.fontFamily}` }
            }
          }
        }
      }
    ]
  }
})

const ParagraphWithLineHeight = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: el => el.style.lineHeight || null,
        renderHTML: attrs => {
          if (!attrs.lineHeight) return {}
          return { style: `line-height: ${attrs.lineHeight}` }
        },
      },
    }
  },
})

const DropcapStyle = Extension.create({
  name: 'dropcapStyle',
  addGlobalAttributes() {
    const attr = k => ({
      default: null,
      parseHTML: el => el.style?.[k] || null,
      renderHTML: attrs => (attrs[k] ? { style: `${k}: ${attrs[k]}` } : {}),
    })
    return [{
      types: ['textStyle'],
      attributes: {
        float: attr('float'),
        display: attr('display'),
        lineHeight: attr('lineHeight'),
        marginRight: attr('marginRight'),
        marginTop: attr('marginTop'),
        fontWeight: attr('fontWeight'),
      },
    }]
  },
})

const TipTapBlock = defineComponent({
  name: 'TipTapBlock',
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue', 'focused'],
  setup(props, { emit }) {
    // Use responsive references to trigger re-rendering
    const editor = shallowRef(null)

    onMounted(() => {
      editor.value = new Editor({
        extensions: [
          StarterKit,
          TextAlign.configure({
            types: ['paragraph', 'heading'],
            alignments: ['left', 'center'] //only allow left and center align
          }),
          TextStyle,
          Color,
          FontSize,
          FontFamily,
          DropcapStyle,
          ParagraphWithLineHeight,
        ],
        content: props.modelValue || '<p></p>',
        onUpdate: ({ editor }) => {
          emit('update:modelValue', editor.getHTML())
        },
        onFocus: () => emit('focused', editor.value)
      })
    })

    // Synchronize content during external changes
    watch(() => props.modelValue, (v) => {
      const e = editor.value
      if (e && v !== e.getHTML()) {
        e.commands.setContent(v || '<p></p>', false)
      }
    })

    onBeforeUnmount(() => editor.value?.destroy())

    // Responsive rendering
    return () =>
      editor.value
        ? h(EditorContent, { editor: editor.value, class: 'prose max-w-none outline-none' })
        : null
  }
})

const sectionStyle = (p) => {
  const h = p.height || 800
  const style = {
    width: '100%',
    minHeight: h + 'px',
    margin: '0 auto',
    boxSizing: 'border-box',
    position: 'relative',
    borderTop: '2px solid #e0e0e0',
    padding: '16px 0',
    overflow: 'visible', // image can fix section height, but limit at image part
    backgroundColor: p.background || '#ffffff',
  }



  if (p.bgType === 'img' && p.bgImg) {
    const displayUrl = getImageDisplayUrl(p.bgImg)
    style.backgroundImage = `url(${displayUrl})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
    style.backgroundRepeat = 'no-repeat'
  }

  return style
}

const bgColorProxy = computed({
  get: () => curr.value?.props?.background ?? '#ffffff',
  set: (val) => store.setSecBg(val)
})

function setHeading(level) {
  store.activeEditor?.chain().focus().setHeading({ level }).run()
}

function setParagraph() {
  store.activeEditor?.chain().focus().setParagraph().updateAttributes('paragraph', { lineHeight: '1.5' }).run()
}

function toggleBold() {
  store.activeEditor?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  store.activeEditor?.chain().focus().toggleItalic().run()
}

function setFontSize(size) {
  const ed = store.activeEditor
  if (!ed) return
  const chain = ed.chain().focus()
  if (size) {
    chain.setMark('textStyle', { fontSize: size }).run()
  } else {
    chain.updateAttributes('textStyle', { fontSize: null })
      .removeEmptyTextStyle()
      .run()
  }
}

watch(
  () => store.activeEditor,
  (ed) => {
    if (!ed) return
    ed.off?.('selectionUpdate')
    ed.on('selectionUpdate', ({ editor }) => {
      const size = editor.getAttributes('textStyle').fontSize
      currentFontSize.value = size || ''
    })
  },
  { immediate: true }
)

function parseSizeToPx(size, parentPx = 16) {
  if (!size) return null
  if (typeof size === 'number') return size
  if (size.endsWith('px')) {
    return parseFloat(size)
  }
  if (size.endsWith('em')) {
    return parseFloat(size) * parentPx
  }
  if (size.endsWith('%')) {
    return parentPx * (parseFloat(size) / 100)
  }
  const v = parseFloat(size)
  return isNaN(v) ? parentPx : v
}

function getFontSizeFromMarks(ed) {
  const attrs = ed.getAttributes('textStyle')
  return attrs?.fontSize || 16
}

function isDropCapActive() {
  const ed = store.activeEditor
  if (!ed) return false
  const { $from } = ed.state.selection
  const start = $from.start()
  ed.chain().setTextSelection({ from: start, to: start + 1 }).run()
  const a = ed.getAttributes('textStyle')
  return a?.float === 'left' && a?.display === 'inline-block'
}

function toggleDropCap() {
  const ed = store.activeEditor
  if (!ed) return
  const { $from } = ed.state.selection
  const start = $from.start()
  const firstChar = ed.state.doc.textBetween(start, start + 1)
  if (!firstChar) return
  ed.chain().focus().setTextSelection({ from: start, to: start + 1 }).run()
  const chain = ed.chain().focus()
  if (isDropCapActive()) {
    chain.updateAttributes('textStyle', {
      float: null,
      display: null,
      fontSize: null,
      lineHeight: null,
      marginRight: null,
      marginTop: null,
      fontWeight: null,
    }).removeEmptyTextStyle().run()
  } else {
    const pEl = (function () {
      let node = ed.view.domAtPos($from.pos).node
      if (node?.nodeType === 3) node = node.parentElement
      return node?.closest('p') || node
    })() || ed.view.dom
    const cs = getComputedStyle(pEl)
    const markSize = getFontSizeFromMarks(ed)
    const parentFs = parseFloat(cs.fontSize) || 16
    const f_p = parseSizeToPx(markSize, parentFs) ?? parentFs
    const lh_px = cs.lineHeight === 'normal'
      ? 1.0 * f_p
      : parseFloat(cs.lineHeight) || (1.5 * f_p)
    const LINES = 2
    const MIN_DROP_SCALE = 1.6
    let sizePx = LINES * lh_px
    sizePx = Math.max(sizePx, f_p * MIN_DROP_SCALE)
    if (f_p < 16) {
      sizePx = 32
    }
    chain.setMark('textStyle', {
      float: 'left',
      display: 'inline-block',
      fontSize: `${sizePx}px`,
      lineHeight: '1.5',
      marginRight: '0.25em',
      marginTop: '0em',
      fontWeight: '700',
    }).run()
  }
}

const currentWidthDisplay = ref('65ch')
const textWidthValueCh = ref(65)

watch(() => store.currBlock, (blk) => {
  const w = blk?.props?.width
  currentWidthDisplay.value = w ? String(w) : '65ch'
  if (!w) { textWidthValueCh.value = 65; return }
  const m = String(w).trim().match(/^(\d+(?:\.\d+)?)(ch|px)$/i)
  if (!m) { textWidthValueCh.value = 65; return }
  const num = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  textWidthValueCh.value = unit === 'ch' ? Math.round(num) : Math.round(num / 8)
}, { immediate: true })

function onWidthSlider(v) {
  const n = Number(v)
  if (!isFinite(n)) return
  store.setTextBlockWidth(n, 'ch')
}

function onWidthNumber(v) {
  const n = Number(v)
  if (!isFinite(n)) return
  store.setTextBlockWidth(n, 'ch')
}

function setAlign(align) {
  store.activeEditor?.chain().focus().setTextAlign(align).run()
}

function isActiveAlign(align) {
  return !!store.activeEditor?.isActive({ textAlign: align })
}

function applyColor() {
  if (store.activeEditor) {
    store.activeEditor
      .chain()
      .focus()
      .setColor(textColor.value)
      .run()
  }
}

function setFontFamily(family) {
  const ed = store.activeEditor
  if (!ed) return
  const chain = ed.chain().focus()
  if (family) {
    chain.setMark('textStyle', { fontFamily: family }).run()
  } else {
    chain.updateAttributes('textStyle', { fontFamily: null })
      .removeEmptyTextStyle()
      .run()
  }
}

async function setLink() {
  const url = await promptInput({
    title: 'Add Link',
    subtitle: 'Enter the URL for this link',
    label: 'URL',
    placeholder: 'https://example.com',
    icon: '🔗',
    inputType: 'url',
    hint: 'Enter the full URL including http:// or https://',
    confirmText: 'Add Link'
  })
  if (!url) return
  store.activeEditor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function unsetLink() {
  store.activeEditor?.chain().focus().unsetLink().run()
}

function replaceImage() {
  const imgPicker = document.createElement('input')
  imgPicker.type = 'file'
  imgPicker.accept = 'image/*'
  imgPicker.onchange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const blk = store.currBlock
    if (!blk) return
    if (blk.type !== 'image' && blk.type !== 'fullwidth-image' && blk.type !== 'float-image') {
      return
    }
    if (blk.type === 'image' && blk._blobUrl && blk._blobUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(blk._blobUrl) } catch {}
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const naturalW = img.naturalWidth || 300
      const naturalH = img.naturalHeight || 300
      const ratio = naturalW / naturalH || 1
      if (blk.type === 'image') {
        const idx = store.selected.imageIndex ?? 0
        if (Array.isArray(blk.images) && blk.images[idx]) {
          blk.images[idx].src = url
          blk.images[idx]._blobUrl = url
          blk.images[idx].aspectRatio = ratio
          if (blk.images[idx].keepRatio && blk.images[idx].width) {
            blk.images[idx].height = Math.round(blk.images[idx].width / ratio)
          }
        } else {
          blk.src = url
          blk._blobUrl = url
          blk.aspectRatio = ratio
          if (blk.keepRatio && blk.width) {
            blk.height = Math.round(blk.width / ratio)
          }
        }
      } else if (blk.type === 'fullwidth-image') {
        blk.image.src = url
        blk.image.aspectRatio = ratio
      } else if (blk.type === 'float-image') {
        blk.image.src = url
        blk.image.aspectRatio = ratio
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
    }
    img.src = url
  }
  imgPicker.click()
}

function onWidthChange(newWidth) {
  store.setVideoWidth(Number(newWidth))
  if (store.currBlock?.keepRatio) {
    const height = Math.round(newWidth * 9 / 16)
    store.setVideoHeight(height)
  }
}

function onToggleRatio(checked) {
  store.setVideoKeepRatio(checked)
  if (checked) {
    const w = store.currBlock.width
    store.setVideoHeight(Math.round(w * 9 / 16))
  }
}
</script>

<style scoped>
.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: var(--nw-canvas-bg);
  width: 100%;
  min-height: 100vh;
  overflow-x: auto;
}

.canvas-area {
  width: 100%;
  height: 100%;
  background-color: var(--nw-canvas-bg);
  overflow-y: auto;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: width 0.3s ease;
  box-shadow: var(--nw-shadow-md);
}

.section-block {
  width: 100%;
  flex-shrink: 0;
  min-height: 200px;
  box-sizing: border-box;
  border-top: 1px solid var(--nw-border);
  padding-top: 24px;
  padding-bottom: 24px;
}

.section-block img,
.section-block video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* highlight checked section */
.section-block.checked {
  outline: 2px solid var(--nw-accent);
  outline-offset: 4px;
  box-shadow: var(--nw-shadow-sm);
}

.floating-tools {
  position: absolute;
  top: 12px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-lg);
  background: var(--nw-surface);
  box-shadow: var(--nw-shadow-md);
  z-index: 10;
}

.floating-tools .tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-tools .tool-label {
  font-size: 12px;
  color: var(--nw-text-secondary);
}

.nw-segmented-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-sm);
  overflow: hidden;
  background: var(--nw-surface);
}

.nw-segment {
  min-width: 40px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: all .15s ease;
  color: var(--nw-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nw-segment + .nw-segment {
  border-left: 1px solid var(--nw-border);
}

.nw-segment:hover {
  background: var(--nw-surface-hover);
  color: var(--nw-text-primary);
}

.nw-segment.active {
  background: var(--nw-primary);
  color: white;
  font-weight: 600;
}

.segment-icon {
  font-size: 14px;
  line-height: 1;
}

.nw-color-picker {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--nw-border);
  border-radius: var(--nw-radius-sm);
  background: var(--nw-surface);
  cursor: pointer;
  transition: border-color .15s ease;
}

.nw-color-picker:hover {
  border-color: var(--nw-primary);
}

.block-wrapper {
  padding: 16px 0;
}

.block-wrapper.fullwidth-wrapper {
  padding: 0;
  margin: -24px 0;
  width: 100%;
  max-width: 100%;
}

.prose {
  background: var(--nw-background);
  border: 1px solid var(--nw-border);
  min-height: 60px;
  padding: 16px;
  border-radius: var(--nw-radius-md);
  transition: all 0.2s ease;
}

.block-checked {
  outline: 2px solid var(--nw-accent);
  outline-offset: 4px;
  box-shadow: var(--nw-shadow-sm);
}

.image-block {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.block-image {
  border-radius: var(--nw-radius-md);
  box-shadow: var(--nw-shadow-sm);
  object-fit: cover;
  transition: all 0.2s ease;
}

.block-image:hover {
  box-shadow: var(--nw-shadow-md);
  transform: translateY(-2px);
}

.image-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
}

.image-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: var(--nw-radius-sm);
  overflow: hidden;
}


.image-cell.caption-right {
  flex-direction: row;
  align-items: center;
}


.image-cell.caption-right .image-caption {
  margin-left: 8px;
  margin-top: 0;
  text-align: left;
  max-width: 180px;
}

.image-cell.caption-bubble {
  position: relative;
}

.image-cell.caption-bubble .image-caption {
  display: none;
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: var(--nw-primary-dark);
  color: white;
  font-size: 0.85rem;
  line-height: 1.3;
  padding: 8px 12px;
  border-radius: var(--nw-radius-sm);
  max-width: 80%;
  text-align: left;
  pointer-events: none;
  transition: opacity 0.2s ease;
  opacity: 0;
  z-index: 2;
  font-family: var(--nw-font-body);
}

.image-cell.caption-bubble:hover .image-caption {
  display: block;
  opacity: 1;
}

.image-selected {
  outline: 2px solid var(--nw-accent);
  outline-offset: 4px;
  box-shadow: var(--nw-shadow-sm);
}

.image-caption {
  font-size: 0.9rem;
  color: var(--nw-text-secondary);
  margin-top: 8px;
  line-height: 1.4;
  text-align: center;
  font-style: italic;
  font-family: var(--nw-font-body);
}

.image-cell.caption-bubble.bubble-anim .image-caption {
  display: block;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity .2s ease, transform .2s ease, visibility 0s linear .2s;
}

.image-cell.caption-bubble.bubble-anim:hover .image-caption {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity .2s ease, transform .2s ease, visibility 0s;
}

.fullwidth-image-block {
  width: 100%;
  max-width: 100%;
  display: block;
  position: relative;
  margin: 0;
}

.fullwidth-image.auto {
  width: 100%;
  height: auto;
  display: block;
}

.fullwidth-image.fixed {
  width: 100%;
  display: block;
  object-fit: cover;
}

.fullwidth-caption {
  font-size: 0.9rem;
  color: var(--nw-text-secondary);
  margin-top: 6px;
  text-align: center;
  font-style: italic;
  font-family: var(--nw-font-body);
}

/* same as image part */

.fullwidth-image-block .image-caption {
  font-size: 0.9rem;
  color: var(--nw-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
  text-align: center;
  font-style: italic;
  font-family: var(--nw-font-body);
}

.fullwidth-image-block.caption-bubble {
  position: relative;
}

.fullwidth-image-block.caption-bubble .image-caption {
  display: none;
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: var(--nw-primary-dark);
  color: var(--nw-text-light);
  font-size: 0.85rem;
  line-height: 1.3;
  padding: 8px 12px;
  border-radius: var(--nw-radius-sm);
  max-width: 80%;
  text-align: left;
  pointer-events: none;
  transition: opacity 0.2s ease;
  opacity: 0;
  z-index: 2;
  font-family: var(--nw-font-body);
}

.fullwidth-image-block.caption-bubble:hover .image-caption {
  display: block;
  opacity: 1;
}

.fullwidth-image-block.caption-bubble.bubble-anim .image-caption {
  display: block;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity .2s ease, transform .2s ease, visibility 0s linear .2s;
}

.fullwidth-image-block.caption-bubble.bubble-anim:hover .image-caption {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity .2s ease, transform .2s ease, visibility 0s;
}

/* Float Image Block */
.float-image-block {
  display: block;
  margin: 1em 0;
  overflow: hidden;
}

.float-img-wrapper {
  display: block;
  max-width: 70%;
}

.float-image-block img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--nw-radius-sm);
}

.float-image-text {
  overflow: hidden;
  font-size: 1rem;
  line-height: 1.6;
  font-family: var(--nw-font-body);
}

.image-caption {
  font-size: 0.85rem;
  color: var(--nw-text-secondary);
  margin: 4px 0 0;
  font-family: var(--nw-font-body);
}

.float-image-block.block-checked {
  outline: 2px solid var(--nw-accent);
  outline-offset: 2px;
}

.float-image-text {
  overflow: hidden;
}

/* float image caption */
.float-img-wrapper {
  position: relative;
}

.float-image-block.caption-right .float-img-wrapper {
  display: flex;
  align-items: center;
  flex-direction: row;
}

.float-image-block.caption-right .image-caption {
  margin-left: 8px;
  font-size: 0.9rem;
  color: var(--nw-text-secondary);
  font-style: italic;
  text-align: left;
  font-family: var(--nw-font-body);
}

.float-image-block.caption-bubble {
  position: relative;
}

.float-image-block.caption-bubble .image-caption {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: none;
  background: var(--nw-primary-dark);
  color: var(--nw-text-light);
  font-size: 0.85rem;
  line-height: 1.3;
  padding: 8px 12px;
  border-radius: var(--nw-radius-sm);
  max-width: 80%;
  text-align: left;
  pointer-events: none;
  transition: opacity 0.2s ease;
  opacity: 0;
  z-index: 2;
  font-family: var(--nw-font-body);
}

.float-image-block.caption-bubble:hover .image-caption {
  display: block;
  opacity: 1;
}

.float-image-block.caption-bubble.bubble-anim .image-caption {
  display: block;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity .2s ease, transform .2s ease, visibility 0s linear .2s;
}

.float-image-block.caption-bubble.bubble-anim:hover .image-caption {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: opacity .2s ease, transform .2s ease, visibility 0s;
}

.video-block {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
}

.video-block iframe {
  border: none;
  border-radius: var(--nw-radius-sm);
  box-shadow: var(--nw-shadow-sm);
}

.text-wrapper {
  transition: max-width 0.25s ease;
  padding: 0.5rem 0;
}

.canvas-area {
  transition: width 0.3s ease;
}
</style>
