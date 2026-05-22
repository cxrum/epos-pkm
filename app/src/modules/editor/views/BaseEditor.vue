<template>
  <div class="editor-wrapper">
    <drag-handle 
      v-if="editor" 
      :editor="editor" 
      :nested="nestedOptions" 
      :compute-position-config="computePositionConfig"
    >
      <div class="custom-drag-handle"></div>
    </drag-handle>
    
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { DragHandle } from '@tiptap/extension-drag-handle-vue-3'
import NodeRange from '@tiptap/extension-node-range'
import StarterKit from '@tiptap/starter-kit'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Placeholder } from '@tiptap/extensions'
import { BlockColor } from '../extension/blockColor'

const NESTED_CONFIG_LTR = { edgeDetection: { threshold: -16, edges: ['left' as const] } }
const NESTED_CONFIG_RTL = { edgeDetection: { threshold: -16, edges: ['right'as const] } }

const model = defineModel<Record<string, any>>({})

const editable = ref(true)
const nested = ref(true)
const rtl = ref(false)

const computePositionConfig = computed(() => {
  return {
    placement: rtl.value ? 'right' as const : 'left' as const,
  }
})

const nestedOptions = computed(() => {
  if (!nested.value) {
    return false
  }

  return rtl.value ? NESTED_CONFIG_RTL : NESTED_CONFIG_LTR
})

const editor = useEditor({
  editable: editable.value,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Press '/' for commands, or type to write...",
    }),
    NodeRange.configure({
      key: null,
    }),
    BlockColor
  ],
  onUpdate: ({ editor: currentEditor }) => {
    editable.value = currentEditor.isEditable
    model.value = currentEditor.getJSON()
  }
})

watch(editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue)
  }
})

watch(rtl, (newValue) => {
  if (!editor.value) {
    return
  }

  if (newValue) {
    editor.value.view.dom.setAttribute('dir', 'rtl')
  } else {
    editor.value.view.dom.removeAttribute('dir')
  }
})

onMounted(() => {
  if (rtl.value && editor.value) {
    editor.value.view.dom.setAttribute('dir', 'rtl')
  }
})

watch(() => model.value, (newValue) => {
  if (!editor.value || !newValue) return

  const isSame = JSON.stringify(newValue) === JSON.stringify(editor.value.getJSON())

  if (!isSame) {
    const { from, to } = editor.value.state.selection
    editor.value.commands.setContent(newValue)
    editor.value.commands.setTextSelection({ from, to })
  }
}, { deep: true })
</script>

<style lang="scss">

::selection {
  background-color: var(--hover);
}

.ProseMirror {
  .ProseMirror-widget * {
    margin-top: auto;
  }

  ul,
  ol {
    padding-inline: 1rem;
  }
}

p, h1, h2, h3, h4, h5, h6, blockquote, pre, div[data-type="callout"] {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }

  > *:first-child {
    margin-top: 0;
  }
  
  > *:last-child {
    margin-bottom: 0;
  }
  
  li {
    p {
      margin-top: 0.25rem;
      margin-bottom: 0.25rem;
    }
  }

.ProseMirror-noderangeselection {
  *::selection {
    background: transparent;
  }

  * {
    caret-color: transparent;
  }
}

.ProseMirror-selectednode,
.ProseMirror-selectednoderange {
  position: relative;

  &::before {
    position: absolute;
    pointer-events: none;
    z-index: -1;
    content: '';
    top: -0.25rem;
    left: -0.25rem;
    right: -0.25rem;
    bottom: -0.25rem;
    background-color: var(--hover);
    border-radius: 0.5rem;
  }
}

.custom-drag-handle {
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    content: '⠿';
    cursor: grab;
    font-weight: 700;
    color: var(--icon-color);
  }
  &:hover{
    background: var(--hover);
    border-radius: 0.5rem;
  }
}


.tiptap p.is-empty::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>