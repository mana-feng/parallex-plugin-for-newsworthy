<template>
  <EditorContent v-if="editor" :editor="editor" class="prose max-w-none outline-none" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'focused'])

const editor = shallowRef(null)

// TipTap Extensions
// TSB文本编辑器扩展：drop（首字下沉）样式能力实现定义位置
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

const DropcapStyle = Extension.create({
  // drop实现：通过 textStyle 的全局属性，控制首字的浮动、显示、字号、行高、边距、字重
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

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center']
      }),
      TextStyle,
      Color,
      FontSize,
      FontFamily,
      DropcapStyle,
    ],
    content: props.modelValue || '<p></p>',
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    },
    onFocus: () => emit('focused', editor.value)
  })
})

watch(() => props.modelValue, (v) => {
  const e = editor.value
  if (e && v !== e.getHTML()) {
    e.commands.setContent(v || '<p></p>', false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style scoped>
.prose {
  background: transparent;
  border: 1px solid transparent;
  min-height: 50px;
  padding: 8px;
}

:deep(.ProseMirror) {
  display: block;
  overflow: visible;
}

:deep(.prose p) {
  margin: 0 0 1em !important;
  clear: none !important;
  line-height: 1.6;
}

:deep(.ProseMirror p) {
  margin: 0 0 1em;
  clear: none;
  line-height: 1.6;
}
</style>

