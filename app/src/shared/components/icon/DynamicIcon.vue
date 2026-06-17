<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import type { Component } from "vue";
import Document from "@/assets/icons/Document.vue";
import type { Icon } from "@/core/types";

const props = defineProps<{
  icon: Icon | undefined;
}>();

const iconMap: Record<string, Component> = {
  document: defineAsyncComponent(() => import("@/assets/icons/Document.vue")),
  object: defineAsyncComponent(() => import("@/assets/icons/TypeIcon.vue")),
  table: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
  error: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
};

const computedIcon = computed<Component>(() => {
  if (props.icon === undefined) {
    return Document;
  }

  if (props.icon.type === "default") {
    const typeId = props.icon.name;
    return typeId && iconMap[typeId] ? iconMap[typeId] : Document;
  } else if (props.icon.type === "link") {
    return Document;
  } else {
    return Document;
  }
});
</script>

<template>
  <span v-if="props.icon?.type === 'emoji'">
    {{ props.icon.emoji }}
  </span>
  <component v-else :is="computedIcon" />
</template>
