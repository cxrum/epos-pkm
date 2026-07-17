<script setup lang="ts" generic="T">
import BaseIcon from "../icon/BaseIcon.vue";
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
  <div class="surface-dialog">
    <div
      v-for="(group, groupIndex) in groups"
      :key="groupIndex"
      class="flex flex-col"
    >
      <label v-if="group.title" class="px-2 py-1">
        {{ group.title }}
      </label>

      <template v-for="(item, itemIndex) in group.items" :key="itemIndex">
        <div v-if="item.type === 'divider'" class="hl"></div>

        <button
          v-else-if="item.type === 'button'"
          @click="handleItemClick(item.action)"
          :disabled="item.disabled"
          class="base-button"
          type="button"
        >
          <template v-if="item.icon">
            <base-icon size="24px">
              <component :is="item.icon" v-if="item.icon" />
            </base-icon>
          </template>

          <p class="truncate">{{ item.label }}</p>
        </button>
      </template>
    </div>
  </div>
</template>
