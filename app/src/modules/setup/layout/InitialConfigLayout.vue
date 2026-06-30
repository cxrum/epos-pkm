<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import FirstRunAuthCard from "../components/FirstRunAuthCard.vue";

const router = useRouter();

const stateStore = useSetupStore();

onMounted(async () => {
  await stateStore.loadWorkspaces();
});

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
    class="flex min-h-screen w-full items-center justify-center px-4 py-6 surface-settings"
  >
    <div
      class="flex w-full max-w-4xl flex-col gap-4 rounded-2xl border border-solid border-(--border) p-4 shadow-2xl surface-context-menu overflow-hidden px-6 md:px-8"
    >
      <div class="flex flex-col justify-center items-center gap-4">
        <span class="flex flex-col items-center">
          <h1>Epos</h1>
          <label>Version: 0.1.0 beta</label>
        </span>
      </div>

      <FirstRunAuthCard />

      <div class="flex flex-col gap-3 rounded-2xl border border-(--border) p-4">
        <div class="flex items-center gap-3">
          <div class="flex flex-col gap-1">
            <p>Workspace storage</p>
            <label>
              Set up a local workspace folder. This stays on the device.
            </label>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <span class="flex flex-row gap-2 items-center rounded-xl border border-(--border) p-4">
            <span class="max-w-2/3">
              <p>Create new workspace</p>
              <label>Create a new workspace under the selected folder</label>
            </span>
            <span class="flex-1"></span>
            <BaseButton @click="handleCreateNew" variant="accent">
              <p class="w-16">Create</p>
            </BaseButton>
          </span>

          <span class="flex flex-row gap-2 items-center rounded-xl border border-(--border) p-4">
            <span class="max-w-2/3">
              <p>Add existing workspace</p>
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
        </div>

        <div class="hl"></div>

        <p>Select a workspace:</p>

        <div
          v-if="stateStore.workspaces.length > 0"
          class="flex flex-col flex-1 gap-2 min-w-0 overflow-y-auto scroll max-h-80"
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
            Nothing here. Try load your existing workspace or create it.
          </label>
        </div>
        <p class="text-(--text-error-color)">
          {{ stateStore.errorMsg }}
        </p>
      </div>
    </div>
  </div>
</template>
