<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const openPage = () => {
  console.log(`Maps to page ID: ${props.node.attrs.pageId}`)
}
</script>

<template>
  <NodeViewWrapper class="page-block-wrapper">
    <div 
      @click="openPage"
      class="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors select-none"
      contenteditable="false"
    >
      <span class="text-xl">📄</span> 
      <span class="font-medium text-gray-700">
        {{ node.attrs.title || 'Untitled Page' }}
      </span>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.page-block-wrapper {
  margin: 8px 0;
}
</style>