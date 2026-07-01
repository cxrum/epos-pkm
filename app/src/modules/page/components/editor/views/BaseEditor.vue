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
import { useEditor, EditorContent, Editor } from "@tiptap/vue-3";
import { Placeholder } from "@tiptap/extensions";
import { EpObjectAttributesExtension } from "../extension/customObjectExtension";
import type { EpContainerObjectEntity } from "@/core/domain/type";
import { entitiesToTiptapDoc, tiptapDocToEntities } from "../mappers";
import { EpBlockExtension } from "../nodes/EpBlockExtension";
import type { EditorControllerContract } from "../contract";
import { UniqueBlockIdExtension } from "../extension/uniqueIdExtension";
import type { ApplicationEvents } from "@/bus/application";
import type { Emitter } from "mitt";
import type { EpObjectId } from "@/core/types";
import { NodeSelection } from "@tiptap/pm/state";

const NESTED_CONFIG_LTR = {
  edgeDetection: { threshold: -16, edges: ["left" as const] },
};
const NESTED_CONFIG_RTL = {
  edgeDetection: { threshold: -16, edges: ["right" as const] },
};

const props = defineProps<{
  controller: EditorControllerContract;
  initial: EpContainerObjectEntity;
  applicationBus: Emitter<ApplicationEvents>;
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
    const parsed = tiptapDocToEntities(res);
    props.controller.updateDraftContent(parsed.content, parsed.order);
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

watch(
  () => props.controller.initialData.value,
  (it) => {
    if (editor.value && it) {
      editor.value?.commands.setContent(
        entitiesToTiptapDoc(
          toRaw(it.content.inlineObjects),
          toRaw(it.content.order),
        ),
      );
    }
  },
);

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

const updateTipTapNodeAttributes = (
  editor: Editor,
  targetObjectId: EpObjectId,
  newAttributes: Record<string, any>,
) => {
  let targetNodePos: number | null = null;
  let currentAttrs: Record<string, any> = {};

  editor.state.doc.descendants((node, pos) => {
    if (
      node.attrs.objectId === targetObjectId ||
      node.attrs.id === targetObjectId
    ) {
      targetNodePos = pos;
      currentAttrs = node.attrs;
      return false;
    }
  });

  if (targetNodePos !== null) {
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(targetNodePos, undefined, {
        ...currentAttrs,
        ...newAttributes,
      }),
    );
  } else {
    console.warn(
      `[TipTap] Вузол з ID ${targetObjectId} не знайдено в редакторі.`,
    );
  }
};

const syncTipTapProperty = (payload: {
  targetObjectId: string;
  propertyId: string;
  newValue: any;
}) => {
  if (!editor.value) return;

  updateTipTapNodeAttributes(editor.value, payload.targetObjectId, {
    [payload.propertyId]: payload.newValue,
  });
};

onBeforeUnmount(() => {
  props.applicationBus.off("draft:property-updated", syncTipTapProperty);
});

onMounted(() => {
  props.applicationBus.on("draft:property-updated", syncTipTapProperty);
  if (rtl.value && editor.value) {
    editor.value.view.dom.setAttribute("dir", "rtl");
  }
});

const forceSelectTipTapNode = (
  editor: Editor,
  targetId: string | undefined,
) => {
  let targetPos: number | null = null;

  editor.state.doc.descendants((node, pos) => {
    if (node.attrs.id === targetId) {
      targetPos = pos;
      return false;
    }
  });

  if (targetPos !== null) {
    const tr = editor.state.tr;
    const selection = NodeSelection.create(editor.state.doc, targetPos);

    editor.view.dispatch(tr.setSelection(selection));

    editor.view.dispatch(editor.state.tr.scrollIntoView());
  }
};

watch(
  () => props.controller.focusedObjectId,
  (it) => {
    if (editor.value) {
      forceSelectTipTapNode(editor.value, it.value);
    }
  },
);
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
