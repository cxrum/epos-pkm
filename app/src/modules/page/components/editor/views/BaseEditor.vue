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
import { ref, computed, watch, onMounted, toRaw } from "vue";
import { DragHandle } from "@tiptap/extension-drag-handle-vue-3";
import NodeRange from "@tiptap/extension-node-range";
import StarterKit from "@tiptap/starter-kit";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import { BlockStyle } from "../extension/blockStyle";
import { PageBlock } from "../nodes/blocks/pageBlock";
import { EpObjectAttributesExtension } from "../extension/customObjectExtension";
import type { ContainerObjectEntity, EpObjectEntity } from "@/core/domain/type";
import {
  entitiesToTiptapDoc,
  mapEntityRecordsToArray,
  mapObjectEntitiesToContent,
  tiptapDocToEntities,
} from "../mappers";

const NESTED_CONFIG_LTR = {
  edgeDetection: { threshold: -16, edges: ["left" as const] },
};
const NESTED_CONFIG_RTL = {
  edgeDetection: { threshold: -16, edges: ["right" as const] },
};

const model = defineModel<EpObjectEntity>({});

const editable = ref(true);
const nested = ref(true);
const rtl = ref(false);

let isInternalUpdate = false;

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
  content: model.value?.content?.inlineObjects
    ? entitiesToTiptapDoc(
        mapEntityRecordsToArray(toRaw(model.value.content.inlineObjects)),
      )
    : undefined,
  extensions: [
    StarterKit,
    EpObjectAttributesExtension,
    Placeholder.configure({
      placeholder: "Press '/' for commands, or type to write...",
    }),
    NodeRange.configure({
      key: null,
    }),
    PageBlock,
    BlockStyle,
  ],
  onUpdate: ({ editor: currentEditor }) => {
    editable.value = currentEditor.isEditable;
    if (model.value) {
      isInternalUpdate = true;
      const res = mapObjectEntitiesToContent(
        tiptapDocToEntities(currentEditor.getJSON()),
      );
      model.value.content.inlineObjects = toRaw(res);
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

watch(
  () => model.value?.content?.inlineObjects,
  (newInlineObjects) => {
    if (!editor.value || !newInlineObjects) return;

    if (isInternalUpdate) {
      isInternalUpdate = false;
      return;
    }
    const currentSelection = editor.value.state.selection;
    const { from, to } = currentSelection;

    const res = mapEntityRecordsToArray(toRaw(newInlineObjects));
    console.log(
      "\nWATCH\n",
      `isInternal: ${isInternalUpdate}\n`,
      res,
      "\nWATCH-END\n",
    );
    editor.value.commands.setContent(entitiesToTiptapDoc(res));

    try {
      editor.value.commands.setTextSelection({ from, to });
    } catch (e) {
      editor.value.commands.focus("end");
    }
  },
  { deep: true },
);

const addPageLink = (
  pageData: import("@/core/domain/type").ContainerObjectEntity,
) => {
  editor.value?.chain().focus().insertPageBlock(pageData).run();
};
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
