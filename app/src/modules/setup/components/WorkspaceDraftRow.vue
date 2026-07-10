<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "commit"): void;
  (event: "cancel"): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const focusAndSelect = async () => {
  await nextTick();
  const input = inputRef.value;
  if (!input) {
    return;
  }

  input.focus();
  input.select();
};

onMounted(() => {
  void focusAndSelect();
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    emit("commit");
  }

  if (event.key === "Escape") {
    event.preventDefault();
    emit("cancel");
  }
};
</script>

<template>
  <div class="flex items-center gap-2 rounded-md border border-(--border) p-2">
    <input
      ref="inputRef"
      class="flex-1 min-w-0 bg-transparent px-1 py-1 outline-none text-(--text-secondary-color)"
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @keydown="handleKeydown"
    />
  </div>
</template>
