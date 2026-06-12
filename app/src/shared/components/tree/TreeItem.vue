<script setup lang="ts">
import ChevronRight from "@/assets/icons/ChevronRight.vue";
import type { TreeControllerContract, TreeNode } from "./contract";
import BaseIcon from "../icon/BaseIcon.vue";
import DynamicIcon from "../icon/DynamicIcon.vue";
import { nextTick, ref } from "vue";
import type { EpObjectId } from "@/core/types.ts";
import BaseInput from "../BaseInput.vue";

const props = defineProps<{
  node: TreeNode;
  layer: number;
  controller: TreeControllerContract<string>;
  ancestors?: string[];
}>();

const emit = defineEmits(["moveNode"]);
const editingId = ref<EpObjectId | undefined>(undefined);
const inputRef = ref<HTMLObjectElement>();
const localTitle = ref(props.node.title);

const dropState = ref<"above" | "inside" | "below" | "none">("none");

const onDragStart = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData("text/plain", id);
  event.dataTransfer?.setData(`dragged-id-${id}`, "");
  event.dataTransfer!.effectAllowed = "move";
  event.stopPropagation();
};

const onDragOver = (event: DragEvent) => {
  const isSelf = event.dataTransfer?.types.includes(
    `dragged-id-${props.node.id}`,
  );
  const isDescendant = props.ancestors?.some((id) =>
    event.dataTransfer?.types.includes(`dragged-id-${id}`),
  );

  if (isSelf || isDescendant) {
    dropState.value = "none";
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer!.dropEffect = "move";

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  const y = event.clientY - rect.top;

  if (y < rect.height * 0.25) {
    dropState.value = "above";
  } else if (y > rect.height * 0.75) {
    dropState.value = "below";
  } else {
    dropState.value = props.node.children ? "inside" : "below";
  }
};

const onDragLeave = (event: DragEvent) => {
  event.stopPropagation();
  dropState.value = "none";
};

const onDrop = (event: DragEvent, targetId: string | undefined) => {
  event.stopPropagation();
  event.preventDefault();

  const draggedId = event.dataTransfer?.getData("text/plain");

  if (draggedId && draggedId !== targetId) {
    emit("moveNode", {
      draggedId,
      targetId,
      position: dropState.value,
    });

    //console.log(`${draggedId} to ${targetId} as ${dropState.value}`);

    const parsedDraggedId = draggedId;
    const parsedTargetId = targetId ?? "-1";

    if (dropState.value === "inside") {
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveIn(parsedDraggedId, parsedTargetId);
      } else {
        console.error("Failed to parse node IDs", { draggedId, targetId });
      }
    } else if (dropState.value === "above") {
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveAbove(parsedDraggedId, parsedTargetId);
      } else {
        console.error("Failed to parse node IDs", { draggedId, targetId });
      }
    } else if (dropState.value === "below") {
      if (!Number.isNaN(parsedDraggedId) && !Number.isNaN(parsedTargetId)) {
        props.controller.moveBelow(parsedDraggedId, parsedTargetId);
      } else {
        console.error("Failed to parse node IDs", { draggedId, targetId });
      }
    }
  }

  dropState.value = "none";
};

const editTitle = async (id: EpObjectId) => {
  editingId.value = id;
  await nextTick();
  inputRef.value?.focus();
};

const saveEditedTitle = (id: EpObjectId) => {
  if (localTitle.value === props.node.title) return;
  props.controller.renameCallBack.value?.(id, localTitle.value);
  editingId.value = undefined;
};

const cancelEditTitle = (id: EpObjectId) => {
  editingId.value = undefined;
};
</script>

<template>
  <template v-if="node.id === '-1'">
    <TreeItem
      v-for="child in node.children"
      :key="child.id"
      :node="child"
      :controller="controller"
      :layer="props.layer"
      :ancestors="props.ancestors"
      @moveNode="emit('moveNode', $event)"
    />
  </template>

  <li v-else>
    <span
      class="tree-row"
      :class="{ 'is-selected': controller.isSelected(node.id) }"
    >
      <BaseIcon
        :class="controller.isExpanded(node.id) ? 'rotate-90' : ''"
        interactive
        @click="controller.toggleExpand(node.id)"
        v-if="node.children?.length"
      >
        <ChevronRight />
      </BaseIcon>
      <div
        v-if="!editingId"
        draggable="true"
        @dragstart="onDragStart($event, node.id.toString())"
        @dragover="onDragOver($event)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, node.id.toString())"
        @click="controller.selectNode(node.id)"
        @dblclick="editTitle(node.id)"
        :class="[`drop-${dropState} w-full`]"
      >
        <DynamicIcon :icon="node.type?.icon" class="base-icon" />
        {{ node.title }}
      </div>
      <BaseInput
        v-else
        ref="inputRef"
        v-model="localTitle"
        :placeholder="node.title"
        @keydown.enter="saveEditedTitle(node.id)"
        @blur="cancelEditTitle(node.id)"
        type="text"
      />
    </span>

    <ul class="childs" v-if="controller.isExpanded(node.id) && node.children">
      <TreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :controller="controller"
        :layer="props.layer + 1"
        :ancestors="[...(props.ancestors || []), node.id.toString()]"
        @moveNode="emit('moveNode', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-row {
  position: relative;
  transition: all 0.1s ease;
}

.drop-above::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--border);
  z-index: 10;
}

.drop-below::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--border);
  z-index: 10;
}

.drop-inside {
  background-color: var(--bg-selected-tree-item);
  outline: 1.5px solid var(--border);
}
</style>
