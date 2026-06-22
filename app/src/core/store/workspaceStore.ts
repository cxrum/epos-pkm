import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { appStateRepository, bootstrapWorkspaceServices } from "../di/global";
import type { Workspace } from "../../../appState";

export const useWorkspaceStore = defineStore("workspace", () => {
  const isSidebarOpen = ref<boolean>(true);
  const isTypeEditorOpen = ref<boolean>(false);
  const isOmniSearchOpen = ref<boolean>(false);
  const isLoading = ref<boolean>(false);

  const selectedWorkspace = ref<Workspace>();

  async function init() {
    selectedWorkspace.value = await appStateRepository.getSelectedWorkspace();
    await bootstrapWorkspaceServices();
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
    init,
    selectedWorkspace,

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
