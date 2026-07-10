<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import FirstRunAuthCard from "../components/FirstRunAuthCard.vue";
import WorkspaceDraftRow from "../components/WorkspaceDraftRow.vue";

const router = useRouter();

const stateStore = useSetupStore();

onMounted(async () => {
  await stateStore.loadWorkspaces();
});

const handleSelectRoot = async () => {
  await stateStore.selectRootPath();
};

const openWorkspace = async (id: string) => {
  await stateStore.selectWorkspace(id);
  await router.push({ name: "workspace" });
};

const addWorkspaceDraft = () => {
  stateStore.beginWorkspaceDraft();
};

const saveWorkspaceDraft = async (id: string) => {
  await stateStore.commitWorkspaceDraft(id);
};

const cancelWorkspaceDraft = (id: string) => {
  stateStore.cancelWorkspaceDraft(id);
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
            <p>Workspaces root</p>
            <label>
              Set up the local directory that contains your workspaces. The app
              uses relative paths inside this root.
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-2 rounded-xl border border-(--border) p-4">
          <div class="flex flex-col gap-1">
            <label>Current root</label>
            <p class="break-all text-sm text-(--text-secondary-color)">
              {{ stateStore.workspacesRootPath || "Not selected" }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <BaseButton @click="handleSelectRoot" variant="secondary">
              Select root
            </BaseButton>
          </div>
        </div>

        <div class="hl"></div>

        <div class="flex items-center gap-3">
          <p class="flex-1">Workspaces</p>
          <BaseButton @click="addWorkspaceDraft" variant="accent">
            Add workspace
          </BaseButton>
        </div>

        <div
          v-if="stateStore.workspaces.length > 0 || stateStore.draftWorkspaces.length > 0"
          class="flex flex-col flex-1 gap-2 min-w-0 overflow-y-auto scroll max-h-80"
        >
          <span
            v-for="value of stateStore.workspaces"
            :key="value.id"
            class="clickable rounded-md border border-(--border) p-2"
            @click="void openWorkspace(value.id)"
          >
            <p>
              {{ value.title }}
            </p>
            <label>
              {{ value.relativePath }}
            </label>
          </span>

          <WorkspaceDraftRow
            v-for="value of stateStore.draftWorkspaces"
            :key="value.id"
            v-model="value.title"
            @commit="saveWorkspaceDraft(value.id)"
            @cancel="cancelWorkspaceDraft(value.id)"
          />
        </div>
        <div v-else class="flex flex-1 justify-center py-16">
          <label>
            Nothing here. Select a root directory, then add a workspace.
          </label>
        </div>
        <p class="text-(--text-error-color)">
          {{ stateStore.errorMsg }}
        </p>
        <p
          v-if="stateStore.warningMsg"
          class="text-(--text-secondary-color)"
        >
          {{ stateStore.warningMsg }}
        </p>
      </div>
    </div>
  </div>
</template>
