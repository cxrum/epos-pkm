<template>
  <NodeViewWrapper>
    <div class="ep-block-wrapper">
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
import { computed } from "vue";
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3";

import PageLinkBlock from "./blocks/PageLinkBlock.vue";
import TextBlock from "./blocks/TextBlock.vue";
import UnknownBlock from "./blocks/UnknownBlock.vue";

const props = defineProps(nodeViewProps);

const componentRegistry: Record<string, any> = {
  "sys:hard-page-link": PageLinkBlock,
};

const resolvedComponent = computed(() => {
  const typeId = props.node.attrs.typeId;
  return componentRegistry[typeId] || UnknownBlock;
});

const isTextEditable = computed(() => {
  return (
    props.node.attrs.typeId === "sys:text" ||
    props.node.attrs.typeId === "sys:heading"
  );
});
</script>

<style scoped>
.ep-block-wrapper {
  display: inline-flex;
  align-items: center;
  width: 100%;
}
</style>
