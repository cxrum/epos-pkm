<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { ref } from "vue";

const stateStore = useSetupStore();
stateStore.loadWorkspaces();

const selectedPath = ref<string | null>(null);

const handleSelectDirectory = async () => {
  const path = await window.electronAPI.selectDirectory();

  if (path) {
    selectedPath.value = path;
  }
};
</script>

<template>
  <div class="px-24">
    <div class="flex flex-col p-4 border-1 border-(--border) rounded-xl gap-4">
      <div>
        <span v-for="value in stateStore.workspaces">
          {{ value.title }}
        </span>
      </div>
      <BaseButton @click="handleSelectDirectory" variant="accent">
        Create new
      </BaseButton>
      <BaseButton @click="handleSelectDirectory" variant="secondary">
        Load exist
      </BaseButton>
      <p v-if="selectedPath">Обраний шлях: {{ selectedPath }}</p>
    </div>
  </div>
</template>
