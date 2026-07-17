<script setup lang="ts">
import { computed, type Component } from "vue";
import Cross from "@/assets/icons/Cross.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import type { MetaId } from "../types";

const props = defineProps<{
  id: MetaId;
  active: boolean;
  icon?: Component;
}>();

const emit = defineEmits<{
  (e: "tab-click", tabId: MetaId): void;
  (e: "close", tabId: MetaId): void;
}>();

const computedClasses = computed(() => {
  const baseClasses = "base-button tab";
  const activeClasses = props.active ? "active" : "cursor-pointer";

  return `${baseClasses} ${activeClasses}`;
});
</script>

<template>
  <button
    @click="emit('tab-click', props.id)"
    :class="computedClasses"
    class="prevent-select"
    type="button"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" />
    </slot>

    <span
      :class="active ? 'text-(--text-default-color)' : ''"
      class="truncate flex-1 text-left"
    >
      <slot></slot>
    </span>

    <BaseIcon
      interactive
      @click.stop="emit('close', props.id)"
      class="tab-cross"
      :class="active ? 'active' : ''"
    >
      <Cross />
    </BaseIcon>
  </button>
</template>
