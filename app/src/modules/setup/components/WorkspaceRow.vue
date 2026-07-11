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
  <div class="flex items-center gap-2 rounded-md border border-(--border) p-2">
    <button
      type="button"
      class="flex min-w-0 flex-1 flex-col text-left"
      @click="emit('open', id)"
    >
      <p class="truncate">
        {{ title }}
      </p>
      <label class="truncate">
        {{ relativePath }}
      </label>
    </button>

    <FloatingPopUpMenu :menu-data="menuData" :context-data="props">
      <template #trigger="{ referenceRef, toggleMenu }">
        <button
          :ref="referenceRef"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-(--icon-color) transition-colors hover:border-(--border) hover:bg-(--bg-context-menu)"
          @click.stop="toggleMenu"
        >
          <DotsMenu />
        </button>
      </template>
    </FloatingPopUpMenu>
  </div>
</template>
