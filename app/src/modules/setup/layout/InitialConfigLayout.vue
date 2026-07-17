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
    class="surface-settings flex min-h-screen w-full items-center justify-center px-4 py-6"
  >
    <section
      class="surface-mid-layer surface-shadow flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-(--border)"
    >
      <div
        class="surface-bottom-layer flex flex-col items-center justify-center gap-4 border-b border-(--border) px-6 py-6 text-center"
      >
        <span class="flex flex-col items-center gap-1">
          <h1>Epos</h1>
          <label>Version: 0.1.0 beta</label>
        </span>
        <div class="surface-dialog rounded-2xl">
          <BaseRadioGroup :options="pages" v-model="currentPage" />
        </div>
      </div>

      <template v-if="currentPage === 'general'">
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          <div class="flex flex-col gap-4">
            <div
              class="surface-bottom-layer flex flex-col gap-3 rounded-2xl border border-(--border) p-4"
            >
              <div class="flex items-center gap-3">
                <div class="flex flex-col gap-1">
                  <p>Workspaces root</p>
                  <label>
                    Set up the local directory that contains your workspaces.
                    The app uses relative paths inside this root.
                  </label>
                </div>
              </div>

              <div
                class="surface-dialog flex flex-col gap-3 rounded-2xl border border-(--border) p-4"
              >
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
            </div>

            <div
              class="surface-bottom-layer flex min-h-[24rem] flex-col gap-4 rounded-2xl border border-(--border) p-4"
            >
              <div class="flex items-center gap-3">
                <div class="flex flex-col gap-1">
                  <p>Workspaces</p>
                  <label>
                    Create, rename, and open workspaces inside the selected
                    root.
                  </label>
                </div>

                <BaseButton
                  class="ml-auto"
                  @click="addWorkspaceDraft"
                  variant="accent"
                >
                  Add workspace
                </BaseButton>
              </div>

              <div
                v-if="
                  stateStore.workspaces.length > 0 ||
                  stateStore.draftWorkspaces.length > 0
                "
                class="surface-dialog scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-(--border) p-3"
              >
                <template
                  v-for="value of stateStore.workspaces"
                  :key="value.id"
                >
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
              <div
                v-else
                class="surface-dialog flex flex-1 items-center justify-center rounded-2xl border border-(--border) px-6 py-16 text-center"
              >
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

      <template v-else-if="currentPage === 'configuration'">
        <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
          <FirstRunAuthCard />
        </div>
      </template>
    </section>
  </div>
</template>
