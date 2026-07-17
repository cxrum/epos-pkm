<script setup lang="ts">
import FloatingPopUpMenu from "@/shared/components/popUpMenu/FloatingPopUpMenu.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import DotsMenu from "@/assets/icons/DotsMenu.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";

type WorkspaceRowContext = {
  id: string;
  title: string;
  relativePath: string;
};

const props = defineProps<WorkspaceRowContext>();

const emit = defineEmits<{
  (event: "open", id: string): void;
  (event: "rename", id: string): void;
  (event: "delete", id: string): void;
}>();

const menuData: MenuGroup<WorkspaceRowContext>[] = [
  {
    items: [
      {
        type: "button",
        label: "Rename",
        action: (workspace) => emit("rename", workspace.id),
      },
      {
        type: "button",
        label: "Delete",
        action: (workspace) => emit("delete", workspace.id),
      },
    ],
  },
];
</script>

<template>
  <div
    class="flex items-center rounded-xl border border-(--border) px-4 hover:bg-(--surface-contrast-layer)"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 flex-col rounded-md py-2 text-left transition-colors"
      @click="emit('open', id)"
    >
      <p class="truncate">
        {{ title }}
      </p>
      <label class="truncate text-sm">
        {{ relativePath }}
      </label>
    </button>

    <FloatingPopUpMenu :menu-data="menuData" :context-data="props">
      <template #trigger="{ referenceRef, toggleMenu }">
        <BaseIcon
          :ref="referenceRef"
          interactive
          type="button"
          aria-label="Workspace actions"
          size="28px"
          @click.stop="toggleMenu"
        >
          <DotsMenu />
        </BaseIcon>
      </template>
    </FloatingPopUpMenu>
  </div>
</template>
