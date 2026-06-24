import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, MetaId, PageMeta } from "../types";

export const useGlobalTabsStore = defineStore("tabs", () => {
  const openedTabs = ref<Map<EpObjectId, PageMeta>>(new Map());
  const activeTab = ref<PageMeta>();

  const clearSelection = () => {
    activeTab.value = undefined;
  };

  const closeTab = (id: MetaId) => {
    openedTabs.value.delete(id);
    if (id === activeTab.value?.id) {
      clearSelection();
    }
  };

  const openTab = (id: MetaId): boolean => {
    if (openedTabs.value.has(id)) {
      activeTab.value = openedTabs.value.get(id);
      return true;
    }
    return false;
  };

  const createTab = (tab: PageMeta) => {
    if (!openedTabs.value.has(tab.id)) {
      openedTabs.value.set(tab.id, tab);
    }
  };

  const updateMeta = (id: string, tab: PageMeta) => {
    openedTabs.value.set(id, tab);
    if (activeTab.value?.id === id) {
      activeTab.value = tab;
    }
  };

  return {
    openedTabs,
    activeTab,

    updateMeta,
    clearSelection,
    createTab,
    openTab,
    closeTab,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGlobalTabsStore, import.meta.hot));
}
