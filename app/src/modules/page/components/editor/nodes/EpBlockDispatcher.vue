<template>
  <BaseBlockLayout :is-selected="isSelected">
    <component
      :is="resolvedComponent"
      :node="node"
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

import UnknownBlock from "./blocks/UnknownBlock.vue";
import { EditorControllerKey } from "../contract.ts";
import BaseBlockLayout from "./BaseBlockLayout.vue";
import MountedPageBlock from "./blocks/MountedPageBlock.vue";
import type { EpTypeId } from "@/core/types.ts";
import LinkBlock from "./blocks/LinkBlock.vue";
import ArrowedLinkBlock from "./blocks/ArrowedLinkBlock.vue";

const props = defineProps(nodeViewProps);

const controller = inject(EditorControllerKey);

if (!controller) {
  throw new Error("EditorController doesnt exist in this context.");
}

const componentRegistry: Record<EpTypeId, any> = {
  "sys:hard-page-link": MountedPageBlock,
  "def:back-link": LinkBlock,
  "def:arrowed-link": ArrowedLinkBlock,
};

const resolvedComponent = computed(() => {
  const typeId = props.node.attrs.typeId;
  return componentRegistry[typeId] || UnknownBlock;
});

const isSelected = computed(() => {
  return controller.focusedObjectId.value === props.node.attrs.id;
});
</script>
