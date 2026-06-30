<template>
  <node-view-wrapper class="custom-code-wrapper">
    <div class="code-header" contenteditable="false">
      <span class="title">Code Snippet</span>
      <select v-model="selectedLanguage" class="lang-select">
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="html">HTML/XML</option>
        <option value="css">CSS</option>
        <option value="json">JSON</option>
      </select>
    </div>

    <div class="code-body" contenteditable="false">
      
      <textarea
        v-if="isEditing"
        v-model="codeContent"
        @blur="isEditing = false"
        class="code-editor"
        autofocus
      ></textarea>

      <div 
        v-else 
        @click="isEditing = true" 
        class="code-preview"
      >
        <highlightjs
          :language="selectedLanguage"
          :code="codeContent"
        />
      </div>

    </div>
  </node-view-wrapper>
</template>

<script setup>
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const language = computed(() => props.nodeAttributes.props?.language.value);

const isEditing = ref(false)

const selectedLanguage = computed({
  get: () => props.node.attrs.language,
  set: (newLang) => props.updateAttributes({ language: newLang })
})

const codeContent = computed({
  get: () => props.nodeAttributes.domainContent,
  set: (newCode) => props.updateAttributes({ code: newCode })
})
</script>

<style scoped>
.custom-code-wrapper {
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid #333;
  overflow: hidden;
  background-color: #1e1e1e;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #2d2d2d;
  color: #ccc;
  font-family: sans-serif;
  font-size: 14px;
}

.lang-select {
  background: #1e1e1e;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 2px 8px;
}

.code-body {
  padding: 0;
}

.code-editor {
  width: 100%;
  min-height: 150px;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 14px;
  border: none;
  padding: 1rem;
  resize: vertical;
  outline: none;
}

.code-preview {
  cursor: text;
  min-height: 150px;
}

.code-preview :deep(pre) {
  margin: 0;
  padding: 1rem;
}
</style>