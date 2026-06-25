<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Component } from "vue";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import type { Icon } from "@/core/types";
import { iconMap } from "./type";

const props = withDefaults(
  defineProps<{
    icon: Icon | undefined;
    fill?: string;
    x?: number;
    y?: number;
    size?: number;
  }>(),
  {
    x: 0,
    y: 0,
    size: 24,
  },
);

const hasLinkLoadError = ref(false);

watch(
  () => props.icon,
  () => {
    hasLinkLoadError.value = false;
  },
  { immediate: true },
);

const emojiIcon = computed(() =>
  props.icon?.type === "emoji" ? props.icon : null,
);
const linkIcon = computed(() => {
  if (props.icon?.type !== "link" || !props.icon.link || hasLinkLoadError.value)
    return null;
  return props.icon;
});

const computedIcon = computed<Component>(() => {
  if (!props.icon || props.icon.type !== "default") return DocumentIcon;
  const typeId = props.icon.name;
  return typeId && iconMap[typeId] ? iconMap[typeId] : DocumentIcon;
});

const emojiY = computed(() => props.y + props.size * 0.75);
const emojiX = computed(() => props.x + props.size / 2);
const emojiFontSize = computed(() => `${props.size * 0.8}px`);
</script>

<template>
  <g class="base" :transform="`translate(${x}, ${y})`">
    <image
      v-if="linkIcon"
      :href="linkIcon.link"
      :width="size"
      :height="size"
      x="0"
      y="0"
      preserveAspectRatio="xMidYMid meet"
      @error="hasLinkLoadError = true"
    />

    <text
      v-else-if="emojiIcon"
      :x="emojiX"
      :y="emojiY"
      :font-size="emojiFontSize"
      text-anchor="middle"
      dominant-baseline="central"
      class="svg-emoji"
    >
      {{ emojiIcon.emoji }}
    </text>

    <svg v-else :width="size" :height="size" x="0" y="0">
      <component
        :is="computedIcon"
        :fill="props.fill"
        width="100%"
        height="100%"
      />
    </svg>
  </g>
</template>

<style scoped>
.base {
  fill: var(--icon-color);
}
.svg-emoji {
  pointer-events: none;
}
</style>
