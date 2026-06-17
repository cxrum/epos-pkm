<script setup lang="ts" generic="T">
import type { PropType, Teleport } from "vue";
import type { MenuGroup } from "./type";

const props = defineProps<{
  groups: MenuGroup<T>[];
  contextData?: T;
}>();

const handleItemClick = (action?: (context: T) => void) => {
  if (action && props.contextData) {
    action(props.contextData);
  } else if (action) {
    (action as () => void)();
  }
};
</script>

<template>
  <div
    class="fixed z-50 flex flex-col w-fit max-w-72 p-2 gap-1 bg-(--bg-context-menu) rounded-md border border-(--border)"
  >
    <div
      v-for="(group, groupIndex) in groups"
      :key="groupIndex"
      class="flex flex-col"
    >
      <span
        v-if="group.title"
        class="px-2 py-1 label text-(--text-secondary-color)"
      >
        {{ group.title }}
      </span>

      <template v-for="(item, itemIndex) in group.items" :key="itemIndex">
        <div
          v-if="item.type === 'divider'"
          class="h-px bg-(--border) my-0.5"
        ></div>

        <button
          v-else-if="item.type === 'button'"
          @click="handleItemClick(item.action)"
          :disabled="item.disabled"
          class="inline-flex justify-start items-center h-fit w-full min-w-[4em] min-h-[2em] px-2 py-[0.2rem] gap-2 rounded-md transition-colors text-(--text-default-color)"
          type="button"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="w-5.5 h-5.5 text-(--icon-color) shrink-0"
          />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>
