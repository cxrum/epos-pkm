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
      ></div>

      <div class="block-content">
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
    actionInterceptor?: (action: () => void) => void;
  }>(),
  {
    actionInterceptor: (action: () => void) => action(),
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
  background: var(--hover);
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
