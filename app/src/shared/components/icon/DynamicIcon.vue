<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
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

const hasLinkLoadError = ref(false);

watch(
  () => props.icon,
  () => {
    hasLinkLoadError.value = false;
  },
  { immediate: true },
);

const emojiIcon = computed(() => {
  return props.icon?.type === "emoji" ? props.icon : null;
});

const linkIcon = computed(() => {
  if (
    props.icon?.type !== "link" ||
    !props.icon.link ||
    hasLinkLoadError.value
  ) {
    return null;
  }

  return props.icon;
});

const imageAlt = computed(() => props.icon?.type ?? "icon");

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
  <span v-if="emojiIcon" class="dynamic-icon-emoji">
    {{ emojiIcon.emoji }}
  </span>
  <img
    v-else-if="linkIcon"
    :src="linkIcon.link"
    :alt="imageAlt"
    class="dynamic-icon-image"
  />
  <component v-else-if="props.icon?.type === 'default'" :is="computedIcon" />
  <DocumentIcon v-else />
</template>

<style scoped>
.dynamic-icon-emoji {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.85em;
  line-height: 1;
}

.dynamic-icon-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
