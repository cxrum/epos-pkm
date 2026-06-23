<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { useRouter } from "vue-router";

const router = useRouter();

const stateStore = useSetupStore();
stateStore.loadWorkspaces();

const handleLoadExist = async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    stateStore.loadWorkspace(path);
  }
};

const handleCreateNew = async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    stateStore.createWorkspace("Undefined", path);
  }
};

const openWorkspace = (id: string) => {
  stateStore.selectWorkspace(id);
  router.push({ name: "workspace" });
};
</script>

<template>
  <div
    class="flex h-screen w-full items-center justify-center px-4 surface-settings"
  >
    <div
      class="flex w-full max-w-xl max-h-152 flex-col gap-4 rounded-xl border border-solid border-(--border) p-4 shadow-2xl surface-context-menu overflow-hidden px-8"
    >
      <div class="flex flex-col justify-center items-center gap-4">
        <span class="flex flex-col items-center">
          <h1>Epos</h1>
          <label>Version: 0.1.0 beta</label>
        </span>
      </div>

      <span class="flex flex-row gap-2 items-center">
        <span class="max-w-2/3">
          <p>Create new workspace</p>
          <label>Create a new workspace under the selected folder</label>
        </span>
        <span class="flex-1"></span>
        <BaseButton @click="handleCreateNew" variant="accent">
          <p class="w-16">Create</p>
        </BaseButton>
      </span>

      <div class="hl"></div>

      <span class="flex flex-row gap-2 items-center">
        <span class="max-w-2/3">
          <p>Add exist workspace</p>
          <label
            >Add an existing workspace. Folder must contain a '.workspace'
            file</label
          >
        </span>
        <span class="flex-1"></span>
        <BaseButton @click="handleLoadExist" variant="secondary">
          <p class="w-16">Add</p>
        </BaseButton>
      </span>
      <div class="hl"></div>

      <p>Select a workspace:</p>

      <div
        v-if="stateStore.workspaces.length > 0"
        class="flex flex-col flex-1 gap-2 min-w-0 overflow-y-auto scroll"
      >
        <span
          v-for="value of stateStore.workspaces"
          :key="value.id"
          class="text-ellipsis clickable p-2 rounded-md"
          @click="openWorkspace(value.id)"
        >
          <p>
            {{ value.title }}
          </p>
          <label>
            {{ value.absolutePath }}
          </label>
        </span>
      </div>
      <div v-else class="flex flex-1 justify-center py-16">
        <label>
          Nothing here. Try load tour existing workspace or create it.
        </label>
      </div>
      <p class="text-(--text-error-color)">
        {{ stateStore.errorMsg }}
      </p>
    </div>
  </div>
</template>
