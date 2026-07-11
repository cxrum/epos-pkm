<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Component } from "vue";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import type { Icon } from "@/core/types";
import { iconMap } from "./type";

const props = defineProps<{
  icon: Icon | undefined;
}>();

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
  <span v-if="emojiIcon" class="base-icon dynamic-icon-emoji">
    {{ emojiIcon.emoji }}
  </span>
  <img
    v-else-if="linkIcon"
    :src="linkIcon.link"
    :alt="imageAlt"
    class="base-icon dynamic-icon-image"
  />
  <component v-else-if="props.icon?.type === 'default'" :is="computedIcon" />
  <DocumentIcon v-else />
</template>
