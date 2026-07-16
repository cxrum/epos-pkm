<template>
  <NodeViewWrapper>
    <div
      class="ep-block-wrapper"
      :class="['my-custom-block', { 'is-focused': isSelected }]"
    >
      <template v-if="props.customDragHandle">
        <div class="custom-drag-handle" data-drag-handle></div>
      </template>

      <div class="block-content" :contenteditable="props.contentEditable">
        <slot :wrap-action="wrapAction" />
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper } from "@tiptap/vue-3";

const props = withDefaults(
  defineProps<{
    isSelected: boolean;
    customDragHandle: boolean;
    contentEditable: boolean;
    actionInterceptor?: (action: () => void) => void;
  }>(),
  {
    actionInterceptor: (action: () => void) => action(),
    customDragHandle: false,
  },
);

const wrapAction = (targetAction: () => void) => {
  props.actionInterceptor(targetAction);
};
</script>

<style scoped lang="scss">
.ep-block-wrapper {
  position: relative;
}

.custom-drag-handle {
  position: absolute;
  top: 4px;
  transform: translateX(-100%);
  cursor: grab;
  user-select: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity;
}
.is-focused {
  outline: 2px solid var(--accent-hover);
  outline-offset: 4px;
  border-radius: 8px;
}

.ep-block-wrapper:hover .custom-drag-handle {
  opacity: 1;
  pointer-events: auto;
}

.ep-block-wrapper.is-focused .custom-drag-handle {
  opacity: 1;
  pointer-events: auto;
}

.block-content {
  width: 100%;
  margin: 4px 0px 4px 0px;
}
</style>
