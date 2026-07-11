<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import { useSetupStore } from "../store/setupStore";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useWorkspaceStore } from "@/core/store/workspaceStore";
import FirstRunAuthCard from "../components/FirstRunAuthCard.vue";
import WorkspaceDraftRow from "../components/WorkspaceDraftRow.vue";
import WorkspaceRow from "../components/WorkspaceRow.vue";

const router = useRouter();

const stateStore = useSetupStore();
const workspaceStore = useWorkspaceStore();
const editingWorkspaceId = ref<string | null>(null);
const editingWorkspaceTitle = ref<string>("Untitled");

onMounted(async () => {
  await stateStore.loadWorkspaces();
  window.addEventListener("workspace-catalog-changed", handleWorkspaceCatalogChanged);
});

onUnmounted(() => {
  window.removeEventListener(
    "workspace-catalog-changed",
    handleWorkspaceCatalogChanged,
  );
});

const handleSelectRoot = async () => {
  await stateStore.selectRootPath();
};

const handleWorkspaceCatalogChanged = () => {
  void stateStore.loadWorkspaces();
};

const openWorkspace = async (id: string) => {
  const opened = await stateStore.selectWorkspace(id);
  if (opened) {
    await workspaceStore.loadAppState();
    await router.push({ name: "workspace" });
  }
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

const beginWorkspaceRename = async (id: string, title: string) => {
  editingWorkspaceId.value = id;
  editingWorkspaceTitle.value = title;
  await nextTick();
};

const saveWorkspaceRename = async (id: string) => {
  const success = await stateStore.renameWorkspace(
    id,
    editingWorkspaceTitle.value,
  );

  if (success) {
    editingWorkspaceId.value = null;
  }
};

const cancelWorkspaceRename = () => {
  editingWorkspaceId.value = null;
  editingWorkspaceTitle.value = "Untitled";
};

const deleteWorkspace = async (id: string) => {
  const confirmed = window.confirm("Delete this workspace?");
  if (!confirmed) {
    return;
  }

  const success = await stateStore.deleteWorkspace(id);
  if (success && editingWorkspaceId.value === id) {
    cancelWorkspaceRename();
  }
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
          <template v-for="value of stateStore.workspaces" :key="value.id">
            <WorkspaceDraftRow
              v-if="editingWorkspaceId === value.id"
              v-model="editingWorkspaceTitle"
              @commit="saveWorkspaceRename(value.id)"
              @cancel="cancelWorkspaceRename"
            />
            <WorkspaceRow
              v-else
              :id="value.id"
              :title="value.title"
              :relative-path="value.relativePath"
              @open="openWorkspace"
              @rename="beginWorkspaceRename(value.id, value.title)"
              @delete="deleteWorkspace"
            />
          </template>

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
