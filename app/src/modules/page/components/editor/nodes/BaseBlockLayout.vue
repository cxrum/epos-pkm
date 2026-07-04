<template>
  <NodeViewWrapper>
    <div
      class="ep-block-wrapper"
      :class="['my-custom-block', { 'is-focused': isSelected }]"
    >
      <div
        class="custom-drag-handle"
        contenteditable="false"
        data-drag-handle
      >
      </div>
      
      <div class="block-content">
        <slot />
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3";

defineProps<{
  isSelected: boolean;
}>();
</script>