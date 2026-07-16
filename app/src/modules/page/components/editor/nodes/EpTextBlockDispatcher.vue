<template>
  <BaseBlockLayout
    :is-selected="isSelected"
    :content-editable="true"
    :custom-drag-handle="false"
  >
    <component
      :is="resolvedComponent"
      :node="node"
      :editor="editor"
      :get-pos="getPos"
      :is-selected="isSelected"
      :node-attributes="node.attrs"
      :update-attributes="updateAttributes"
    >
      <NodeViewContent />
    </component>
  </BaseBlockLayout>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { nodeViewProps, NodeViewContent } from "@tiptap/vue-3";
import { EditorControllerKey } from "../contract";
import type { EpTypeId } from "@/core/types";
import MathBlockView from "./blocks/MathBlockView.vue";
import UnknownBlock from "./blocks/UnknownBlock.vue";
import BaseBlockLayout from "./BaseBlockLayout.vue";

const props = defineProps(nodeViewProps);

const controller = inject(EditorControllerKey);
if (!controller) {
  throw new Error("EditorController doesnt exist in this context.");
}

const componentRegistry: Record<EpTypeId, any> = {
  "def:latex": MathBlockView,
};

const resolvedComponent = computed(() => {
  const typeId = props.node.attrs.typeId;
  return componentRegistry[typeId] || UnknownBlock;
});

const isSelected = computed(() => {
  return controller.focusedObjectId.value === props.node.attrs.id;
});
</script>
