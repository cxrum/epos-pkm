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
    <div class="base-input" @click="handleWrapperClick">
      <slot name="prefix"></slot>

      <input ref="inputRef" v-model="model" v-bind="$attrs" />

      <slot name="suffix"></slot>

      <slot></slot>
    </div>
    <label v-if="errMsg" class="text-(--text-error-color)">
      {{ errMsg }}
    </label>
  </div>
</template>
