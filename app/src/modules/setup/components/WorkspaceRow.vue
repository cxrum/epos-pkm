<script setup lang="ts">
import FloatingPopUpMenu from "@/shared/components/popUpMenu/FloatingPopUpMenu.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import DotsMenu from "@/assets/icons/DotsMenu.vue";

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
    class="surface-mid-layer flex items-center gap-2 rounded-xl border border-(--border) p-2"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 flex-col rounded-lg px-2 py-2 text-left transition-colors hover:bg-(--surface-contrast-layer)"
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
        <button
          :ref="referenceRef"
          type="button"
          aria-label="Workspace actions"
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-(--icon-color) transition-colors hover:border-(--border) hover:bg-(--surface-contrast-layer)"
          @click.stop="toggleMenu"
        >
          <DotsMenu />
        </button>
      </template>
    </FloatingPopUpMenu>
  </div>
</template>
