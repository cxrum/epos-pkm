import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import type { MetaId, PageMeta } from "../types";

export const useGlobalTabsStore = defineStore("tabs", () => {
  const openedTabs = ref<PageMeta[]>([]);
  const activeTab = ref<PageMeta>();

  const clearSelection = () => {
    activeTab.value = undefined;
  };

  const closeTab = (id: MetaId) => {
    const index = openedTabs.value.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      openedTabs.value.splice(index, 1);
    }

    if (id === activeTab.value?.id) {
      clearSelection();
    }
  };

  const openTab = (id: MetaId): boolean => {
    const foundTab = openedTabs.value.find((tab) => tab.id === id);
    if (foundTab) {
      activeTab.value = foundTab;
      return true;
    }
    return false;
  };

  const createTab = (tab: PageMeta) => {
    const exists = openedTabs.value.some(
      (existingTab) => existingTab.id === tab.id,
    );
    if (!exists) {
      openedTabs.value.push(tab);
    }
  };

  return {
    openedTabs,
    activeTab,
    clearSelection,
    createTab,
    openTab,
    closeTab,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGlobalTabsStore, import.meta.hot));
}
