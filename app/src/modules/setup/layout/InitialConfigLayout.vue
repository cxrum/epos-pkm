<script lang="ts" setup>
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseRadioGroup from "@/shared/components/BaseRadioGroup.vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import FirstRunAuthCard from "../components/FirstRunAuthCard.vue";
import WorkspaceDraftRow from "../components/WorkspaceDraftRow.vue";
import WorkspaceRow from "../components/WorkspaceRow.vue";
import { useSetupStore } from "../store/setupStore";

const router = useRouter();
const stateStore = useSetupStore();
const workspaceStore = useWorkspaceStore();
const editingWorkspaceId = ref<string | null>(null);
const editingWorkspaceTitle = ref<string>("Untitled");

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
  window.addEventListener(
    "workspace-catalog-changed",
    handleWorkspaceCatalogChanged,
  );
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
    class="flex h-screen w-full items-center justify-center px-4 surface-settings"
  >
    <section
      class="flex w-full max-w-2xl h-2/3 flex-col gap-4 rounded-xl border border-solid border-(--border) p-4 shadow-2xl surface-context-menu overflow-hidden px-8"
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
        <div class="flex flex-col gap-6 flex-1 min-w-0">
          <span class="flex flex-col">
            <h2>Workspace configuration</h2>
            <label>
              Set up a local workspace folder. This stays on the device. Also
              you can configure self-hosted sync sever.
            </label>
          </span>

          <div class="flex flex-col gap-4">
            <div class="flex flex-row gap-2 items-center">
              <span class="max-w-2/3 flex flex-col">
                <p>Workspace root directory</p>
                <label class="break-all"
                  >Current:
                  {{ stateStore.workspacesRootPath || "Not selected" }}</label
                >
              </span>
              <span class="flex-1"></span>
              <BaseButton @click="handleSelectRoot" variant="secondary">
                <p class="w-24 text-center">Select</p>
              </BaseButton>
            </div>

            <div class="flex flex-row gap-2 items-center">
              <span class="max-w-2/3 flex flex-col">
                <p>Create new workspace</p>
                <label
                  >Create a new workspace under the selected root folder</label
                >
              </span>
              <span class="flex-1"></span>
              <BaseButton @click="addWorkspaceDraft" variant="accent">
                <p class="w-24 text-center">Create</p>
              </BaseButton>
            </div>
          </div>

          <div class="hl"></div>

          <div class="flex flex-col gap-2 flex-1 min-w-0">
            <h3>Select a workspace</h3>

            <div
              v-if="
                stateStore.workspaces.length > 0 ||
                stateStore.draftWorkspaces.length > 0
              "
              class="flex flex-col flex-1 min-w-0 overflow-y-auto scroll max-h-80 gap-2"
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
            <div v-else class="flex flex-1 justify-center py-16 text-center">
              <label>
                Nothing here. Select a root directory, then create a workspace.
              </label>
            </div>

            <label v-if="stateStore.errorMsg">
              {{ stateStore.errorMsg }}
            </label>
            <label v-if="stateStore.warningMsg">
              {{ stateStore.warningMsg }}
            </label>
          </div>
        </div>
      </template>

      <template v-else-if="currentPage === 'configuration'">
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <FirstRunAuthCard />
        </div>
      </template>
    </section>
  </div>
</template>
