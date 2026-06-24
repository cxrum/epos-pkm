import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import {
  appStateRepository,
  bootstrapWorkspaceServices,
  workspaceStateRepository,
} from "../di/global";
import type { WorkspaceConf } from "../../../appState";
import type { SavedTab, WorkspaceLocalState } from "../domain/workspace";

export const useWorkspaceStore = defineStore("workspace", () => {
  const isSidebarOpen = ref<boolean>(true);

  const isTypeEditorOpen = ref<boolean>(false);
  const isOmniSearchOpen = ref<boolean>(false);
  const isLoading = ref<boolean>(false);

  const isInitialized = ref<boolean>(false);
  const selectedWorkspace = ref<WorkspaceConf | undefined>();

  async function loadAppState() {
    await appStateRepository.hotReload();
    selectedWorkspace.value = await appStateRepository.getSelectedWorkspace();
    isInitialized.value = false;
  }

  async function saveWorkspaceState(state: WorkspaceLocalState) {
    await workspaceStateRepository.saveState(state);
  }

  async function saveLastActiveTab(tab: SavedTab) {
    await workspaceStateRepository.saveLastActiveTab(tab);
  }

  async function saveTabs(tabs: SavedTab[]) {
    await workspaceStateRepository.saveTabs(tabs);
  }

  async function state(): Promise<WorkspaceLocalState> {
    return (await workspaceStateRepository.get()).state;
  }

  async function init() {
    await bootstrapWorkspaceServices();
    isInitialized.value = true;
  }

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
  }

  function toggleTypeEditor() {
    isTypeEditorOpen.value = !isTypeEditorOpen.value;
  }

  const toggleOmniSearch = () => {
    isOmniSearchOpen.value = !isOmniSearchOpen.value;
  };

  const closeOmniSearch = () => {
    isOmniSearchOpen.value = false;
  };

  const setLoadingStatus = (value: boolean) => {
    isLoading.value = value;
  };

  return {
    isSidebarOpen,
    isTypeEditorOpen,
    isOmniSearchOpen,
    isLoading,
    selectedWorkspace,
    isInitialized,

    init,
    state,
    saveWorkspaceState,
    saveLastActiveTab,
    saveTabs,
    loadAppState,
    setLoadingStatus,
    toggleSidebar,
    toggleTypeEditor,
    toggleOmniSearch,
    closeOmniSearch,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkspaceStore, import.meta.hot));
}
