<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import type { Component } from "vue";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import type { Icon } from "@/core/types";

const props = defineProps<{
  icon: Icon | undefined;
}>();

const iconMap: Record<string, Component> = {
  document: defineAsyncComponent(
    () => import("@/assets/icons/DocumentIcon.vue"),
  ),
  object: defineAsyncComponent(() => import("@/assets/icons/TypeIcon.vue")),
  table: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
  error: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
};

const computedIcon = computed<Component>(() => {
  if (props.icon === undefined) {
    return DocumentIcon;
  }

  if (props.icon.type === "default") {
    const typeId = props.icon.name;
    return typeId && iconMap[typeId] ? iconMap[typeId] : DocumentIcon;
  } else if (props.icon.type === "link") {
    return DocumentIcon;
  } else {
    return DocumentIcon;
  }
});
</script>

<template>
  <span v-if="props.icon?.type === 'emoji'">
    {{ props.icon.emoji }}
  </span>
  <component v-else :is="computedIcon" />
</template>
