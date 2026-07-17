<script setup lang="ts">
import BaseInput from "@/shared/components/BaseInput.vue";
import { nextTick, onMounted, ref } from "vue";
import {
  focusAndSelectInput,
  resolveWorkspaceDraftRowAction,
} from "./workspaceDraftRowBehavior";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "commit"): void;
  (event: "cancel"): void;
}>();

const inputRef = ref<InstanceType<typeof BaseInput> | null>(null);

const focusAndSelect = async () => {
  await nextTick();
  focusAndSelectInput(inputRef.value);
};

onMounted(() => {
  void focusAndSelect();
});

const handleKeydown = (event: KeyboardEvent) => {
  const action = resolveWorkspaceDraftRowAction(event.key);

  if (!action) {
    return;
  }

  event.preventDefault();

  if (action === "commit") {
    emit("commit");
  } else {
    emit("cancel");
  }
};
</script>

<template>
  <div
    class="surface-mid-layer flex items-center gap-2 rounded-xl border border-(--border) p-2"
  >
    <BaseInput
      ref="inputRef"
      :model-value="modelValue"
      class="flex-1"
      placeholder="Workspace name"
      @update:modelValue="emit('update:modelValue', String($event))"
      @keydown="handleKeydown"
    />
  </div>
</template>
