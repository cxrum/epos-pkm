import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { appStateRepository, bootstrapWorkspaceServices } from "../di/global";
import type { Workspace } from "../../../appState";

export const useWorkspaceStore = defineStore("workspace", () => {
  const isSidebarOpen = ref<boolean>(true);
  const isTypeEditorOpen = ref<boolean>(false);
  const isOmniSearchOpen = ref<boolean>(false);
  const isLoading = ref<boolean>(false);

  const isInitialized = ref<boolean>(false);
  const selectedWorkspace = ref<Workspace | undefined>();

  async function loadAppState() {
    await appStateRepository.hotReload();
    selectedWorkspace.value = await appStateRepository.getSelectedWorkspace();
    isInitialized.value = false;
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
