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
  description: {
    type: String,
    default: null,
  },
});

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select(),
});

defineOptions({
  inheritAttrs: false,
});

const handleWrapperClick = () => {
  inputRef.value?.focus();
};
</script>

<template>
  <div class="flex flex-col">
    <p class="text-(--text-secondary-color)" v-if="label">
      {{ label }}
    </p>
    <div class="base-input" @click="handleWrapperClick">
      <slot name="prefix"></slot>

      <input
        ref="inputRef"
        v-model="model"
        class="min-w-0 flex-1"
        v-bind="$attrs"
      />

      <slot name="suffix"></slot>

      <slot></slot>
    </div>
    <label v-if="errMsg" class="text-(--text-error-color)">
      {{ errMsg }}
    </label>
    <label v-if="description">
      {{ description }}
    </label>
  </div>
</template>
