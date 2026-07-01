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
      <component
        :is="resolvedComponent"
        :node-attributes="node.attrs"
        :update-attributes="updateAttributes"
      >
        <NodeViewContent v-if="isTextEditable" />
      </component>
    </div>
  </NodeViewWrapper>
</template>
<script setup lang="ts">
import { computed, inject } from "vue";
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3";

import PageLinkBlock from "./blocks/PageLinkBlock.vue";
import UnknownBlock from "./blocks/UnknownBlock.vue";
import { EditorControllerKey } from "../contract.ts";

const props = defineProps(nodeViewProps);

const controller = inject(EditorControllerKey);

if (!controller) {
  throw new Error(
    "EditorController не знайдено! Переконайтеся, що ви викликали provide() вище по дереву.",
  );
}

const componentRegistry: Record<string, any> = {
  "sys:hard-page-link": PageLinkBlock,
};

const resolvedComponent = computed(() => {
  const typeId = props.node.attrs.typeId;
  return componentRegistry[typeId] || UnknownBlock;
});

const isTextEditable = computed(() => {
  return (
    props.node.attrs.typeId === "def:text" ||
    props.node.attrs.typeId === "def:heading"
  );
});

const isSelected = computed(() => {
  return controller.focusedObjectId.value === props.node.attrs.id;
});
</script>

<style scoped>
.ep-block-wrapper {
  display: inline-flex;
  align-items: center;
  width: 100%;
}
.ep-block-wrapper .is-focused {
  border-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}
</style>
