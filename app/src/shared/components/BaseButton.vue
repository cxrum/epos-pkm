<script setup lang="ts">
import { computed, type Component } from "vue";

defineOptions({
  inheritAttrs: false,
});

type ButtonVariant = "default" | "secondary" | "accent";
type ButtonAlign = "start" | "center";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    icon?: Component | null;
    iconPosition?: "left" | "right";
    isContentVisible?: boolean;
    align?: ButtonAlign;
  }>(),
  {
    variant: "default",
    icon: null,
    iconPosition: "left",
    isContentVisible: true,
    align: "start",
  },
);

const baseClasses =
  "base-button inline-flex items-center h-fit w-fit min-h-[2em] px-[0.5rem] py-[0.2rem] gap-[0.5rem] rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  default: "button-variant-default",
  secondary: "button-variant-secondary",
  accent: "button-variant-accent",
};

const alignClasses: Record<ButtonAlign, string> = {
  start: "justify-start",
  center: "justify-center",
};

const computedClasses = computed(() => {
  const contentStyle = props.isContentVisible
    ? alignClasses[props.align]
    : "justify-center";

  return `${baseClasses} ${contentStyle} ${variantClasses[props.variant]}`;
});
</script>

<template>
  <button
    :class="computedClasses"
    v-bind="$attrs"
    class="prevent-select"
    type="button"
  >
    <component
      :is="icon"
      v-if="icon && iconPosition === 'left'"
      class="base-icon"
    />

    <span v-show="isContentVisible" class="truncate whitespace-nowrap">
      <slot></slot>
    </span>

    <component
      :is="icon"
      v-if="icon && iconPosition === 'right'"
      class="base-icon"
    />
  </button>
</template>
