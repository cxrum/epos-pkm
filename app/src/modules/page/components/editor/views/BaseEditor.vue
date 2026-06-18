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

const NESTED_CONFIG_LTR = {
  edgeDetection: { threshold: -16, edges: ["left" as const] },
};
const NESTED_CONFIG_RTL = {
  edgeDetection: { threshold: -16, edges: ["right" as const] },
};

const props = defineProps<{
  controller: EditorControllerContract;
}>();

const model = defineModel<EpContainerObjectEntity>({});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setInterval> | null = null;
let pendingJsonData: any = null;

const editable = ref(true);
const nested = ref(true);
const rtl = ref(false);

let isInternalUpdate = false;

const performSave = () => {
  if (!pendingJsonData) return;

  isInternalUpdate = true;

  const mapped = tiptapDocToEntities(pendingJsonData);

  if (model.value) {
    model.value.content.inlineObjects = toRaw(
      mapObjectEntitiesToContent(mapped.content),
    );
    model.value.content.order = toRaw(mapped.order);
  }

  pendingJsonData = null;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (maxWaitTimer) {
    clearInterval(maxWaitTimer);
    maxWaitTimer = null;
  }
};

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
        toRaw(model.value.content.inlineObjects),
        toRaw(model.value.content.order),
      )
    : undefined,
  extensions: [
    StarterKit,
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
    pendingJsonData = currentEditor.getJSON();

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performSave, 800);

    if (!maxWaitTimer) {
      maxWaitTimer = setInterval(performSave, 5000);
    }
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

watch(
  () => model.value?.content?.inlineObjects,
  (newInlineObjects) => {
    if (!editor.value || !newInlineObjects || !model.value?.content?.order)
      return;

    if (isInternalUpdate) {
      isInternalUpdate = false;
      return;
    }

    const currentSelection = editor.value.state.selection;
    const { from, to } = currentSelection;

    editor.value.commands.setContent(
      entitiesToTiptapDoc(
        toRaw(newInlineObjects),
        toRaw(model.value.content.order),
      ),
    );

    try {
      editor.value.commands.setTextSelection({ from, to });
    } catch (e) {
      editor.value.commands.focus("end");
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (maxWaitTimer) clearInterval(maxWaitTimer);

  if (pendingJsonData) {
    performSave();
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
