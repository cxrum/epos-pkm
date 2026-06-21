<template>
  <div class="editor-wrapper">
    <drag-handle
      v-if="editor"
      :editor="editor"
      :nested="nestedOptions"
      :compute-position-config="computePositionConfig"
    >
      <div class="custom-drag-handle"></div>
    </drag-handle>

    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, toRaw, onBeforeUnmount } from "vue";
import { DragHandle } from "@tiptap/extension-drag-handle-vue-3";
import NodeRange from "@tiptap/extension-node-range";
import StarterKit from "@tiptap/starter-kit";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import { EpObjectAttributesExtension } from "../extension/customObjectExtension";
import type { EpContainerObjectEntity } from "@/core/domain/type";
import { entitiesToTiptapDoc, tiptapDocToEntities } from "../mappers";
import { EpBlockExtension } from "../nodes/EpBlockExtension";
import type { EditorControllerContract } from "../contract";
import { mapObjectEntitiesToContent } from "../helpers";
import { UniqueBlockIdExtension } from "../extension/uniqueIdExtension";

const NESTED_CONFIG_LTR = {
  edgeDetection: { threshold: -16, edges: ["left" as const] },
};
const NESTED_CONFIG_RTL = {
  edgeDetection: { threshold: -16, edges: ["right" as const] },
};

const props = defineProps<{
  controller: EditorControllerContract;
  initial: EpContainerObjectEntity;
}>();

const editable = ref(true);
const nested = ref(true);
const rtl = ref(false);

const computePositionConfig = computed(() => {
  return {
    placement: rtl.value ? ("right" as const) : ("left" as const),
  };
});

const nestedOptions = computed(() => {
  if (!nested.value) {
    return false;
  }

  return rtl.value ? NESTED_CONFIG_RTL : NESTED_CONFIG_LTR;
});

const editor = useEditor({
  editable: editable.value,
  content: entitiesToTiptapDoc(
    toRaw(props.initial.content.inlineObjects),
    toRaw(props.initial.content.order),
  ),
  extensions: [
    StarterKit,
    UniqueBlockIdExtension,
    EpObjectAttributesExtension,
    EpBlockExtension,
    Placeholder.configure({
      placeholder: "Press '/' for commands, or type to write...",
    }),
    NodeRange.configure({
      key: null,
    }),
  ],
  onUpdate: ({ editor: currentEditor }) => {
    const res = currentEditor.getJSON();
    if (res === undefined) {
      return;
    }
    props.controller.updateDraftContent(res);
  },
  onSelectionUpdate({ editor }) {
    const { $anchor } = editor.state.selection;
    const currentNode = $anchor.parent;

    if (currentNode && currentNode.attrs.id) {
      props.controller.setObjectId(currentNode.attrs.id);
    } else {
      props.controller.clearSelection();
    }
  },
});

watch(editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue);
  }
});

watch(rtl, (newValue) => {
  if (!editor.value) {
    return;
  }

  if (newValue) {
    editor.value.view.dom.setAttribute("dir", "rtl");
  } else {
    editor.value.view.dom.removeAttribute("dir");
  }
});

onMounted(() => {
  if (rtl.value && editor.value) {
    editor.value.view.dom.setAttribute("dir", "rtl");
  }
});
</script>

<style lang="scss">
.ProseMirror {
  .ProseMirror-widget * {
    margin-top: auto;
  }

  ul,
  ol {
    padding-inline: 1rem;
  }
}

.ProseMirror-selectednode,
.ProseMirror-selectednoderange {
  position: relative;

  &::before {
    position: absolute;
    pointer-events: none;
    z-index: -1;
    content: "";
    top: -0.25rem;
    left: -0.25rem;
    right: -0.25rem;
    bottom: -0.25rem;
    background-color: var(--hover);
    border-radius: 0.5rem;
  }
}

.custom-drag-handle {
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    content: "⠿";
    cursor: grab;
    font-weight: 700;
    color: var(--icon-color);
  }
  &:hover {
    background: var(--hover);
    border-radius: 0.5rem;
  }
}

.tiptap p.is-empty::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
