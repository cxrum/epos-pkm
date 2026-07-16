<template>
  <BaseBlockLayout
    :is-selected="isSelected"
    :action-interceptor="handleBlockAction"
    @click="handleNativeClick"
    v-slot="{ wrapAction }"
    :custom-drag-handle="true"
    :content-editable="false"
  >
    <component
      :is="resolvedComponent"
      :node="node"
      :editor="editor"
      :get-pos="getPos"
      :is-selected="isSelected"
      :node-attributes="node.attrs"
      :update-attributes="updateAttributes"
      :wrap-action="wrapAction"
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
import { useObjectEditorStore } from "@/modules/page/store/objectEditorStore.ts";

const props = defineProps(nodeViewProps);
const controller = inject(EditorControllerKey);
const editorStore = useObjectEditorStore();

if (!controller) {
  throw new Error("EditorController doesnt exist in this context.");
}

const componentRegistry: Record<EpTypeId, any> = {
  "sys:hard-page-link": MountedPageBlock,
  "def:back-link": LinkBlock,
  "def:arrowed-link": ArrowedLinkBlock,
};

const id = computed(() => props.node.attrs.id);
const typeId = computed(() => props.node.attrs.typeId);

const resolvedComponent = computed(() => {
  return componentRegistry[typeId.value] || UnknownBlock;
});

const isSelected = computed(() => {
  return controller.focusedObjectId.value === id.value;
});

const handleBlockAction = (targetAction: () => void) => {
  if (editorStore.isObjectEidtorOpen) {
    selectNativeNode();
  } else {
    targetAction();
  }
};

const handleNativeClick = () => {
  if (editorStore.isObjectEidtorOpen && !isSelected.value) {
    selectNativeNode();
  }
};

const selectNativeNode = () => {
  if (typeof props.getPos === "function") {
    props.editor.commands.setNodeSelection(props.getPos());
  }
};
</script>
