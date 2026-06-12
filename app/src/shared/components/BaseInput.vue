<script setup lang="ts">
import { ref } from "vue";

const inputRef = ref<HTMLInputElement | null>(null);
const model = defineModel<string | number>();
const props = defineProps({
  label: {
    type: String,
    default: null,
  },
  errMsg: {
    type: String,
    default: null,
  },
});

defineExpose({
  focus: () => inputRef.value?.focus(),
});

defineOptions({
  inheritAttrs: false,
});

const handleWrapperClick = () => {
  inputRef.value?.focus();
};
</script>

<template>
  <div class="w-fit flex flex-col">
    <span v-if="label">
      {{ label }}
    </span>
    <div
      class="inline-flex items-center border border-(--border) p-1 rounded-md text-(--text-secondary-color) transition-colors cursor-text focus-within:border-(--hovered)"
      @click="handleWrapperClick"
    >
      <slot name="prefix"></slot>

      <input
        ref="inputRef"
        v-model="model"
        v-bind="$attrs"
        class="px-2 bg-transparent outline-none w-full"
      />

      <slot name="suffix"></slot>

      <slot></slot>
    </div>
    <label v-if="errMsg" class="text-(--text-error-color)">
      {{ errMsg }}
    </label>
  </div>
</template>
