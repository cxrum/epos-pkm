<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import BaseRadioGroup from "@/shared/components/BaseRadioGroup.vue";
import FirstRunAuthCard from "../components/FirstRunAuthCard.vue";

const router = useRouter();
const stateStore = useSetupStore();

type Page = "general" | "configuration";

const currentPage = ref<Page>("general");
const pages = [
  {
    id: "general",
    label: "General",
  },
  {
    id: "configuration",
    label: "Synchronization",
  },
];

onMounted(async () => {
  await stateStore.loadWorkspaces();
});

const handleLoadExist = async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    stateStore.loadWorkspace(path);
  }
};

const handleConfigurePage = async () => {
  currentPage.value = "configuration";
};

const handleGeneralPage = async () => {
  currentPage.value = "general";
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
    <section
      class="flex w-full max-w-xl h-2/3 flex-col gap-4 rounded-xl border border-solid border-(--border) p-4 shadow-2xl surface-context-menu overflow-hidden px-8"
    >
      <div class="flex flex-col gap-4 justify-center items-center">
        <span class="flex flex-col items-center">
          <h1>Epos</h1>
          <label>Version: 0.1.0 beta</label>
        </span>
        <BaseRadioGroup :options="pages" v-model="currentPage"></BaseRadioGroup>
      </div>
      <div class="hl"></div>

      <template v-if="currentPage === 'general'">
        <div class="flex flex-col gap-6">
          <span class="flex flex-col">
            <h2>Workspace configuration</h2>
            <label>
              Set up a local workspace folder. This stays on the device. Also
              you can configure self-hosted sync sever.
            </label>
          </span>
          <div class="flex flex-col gap-4">
            <div class="flex flex-row gap-2 items-center">
              <span class="max-w-2/3">
                <p>Create new workspace</p>
                <label>Create a new workspace under the selected folder</label>
              </span>
              <span class="flex-1"></span>
              <BaseButton @click="handleCreateNew" variant="accent">
                <p class="w-24">Create</p>
              </BaseButton>
            </div>

            <div class="flex flex-row gap-2 items-center">
              <span class="max-w-2/3">
                <p>Add exist workspace</p>
                <label
                  >Add an existing workspace. Folder must contain a '.workspace'
                  configuration file</label
                >
              </span>
              <span class="flex-1"></span>
              <BaseButton @click="handleLoadExist" variant="secondary">
                <p class="w-24">Add</p>
              </BaseButton>
            </div>
          </div>

          <div class="hl"></div>

          <div class="flex flex-col gap-2">
            <h3>Select a workspace</h3>

            <div
              v-if="stateStore.workspaces.length > 0"
              class="flex flex-col flex-1 min-w-0 overflow-y-auto scroll max-h-80"
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
      </template>

      <template v-else-if="currentPage === 'configuration'">
        <FirstRunAuthCard></FirstRunAuthCard>
      </template>
    </section>
  </div>
</template>
