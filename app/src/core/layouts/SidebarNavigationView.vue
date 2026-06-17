<script setup lang="ts">
import BaseButton from "@/shared/components/BaseButton.vue";
import Search from "@/assets/icons/Search.vue";
import TypeDictionary from "@/assets/icons/TypeDictionary.vue";
import Graph from "@/assets/icons/Graph.vue";
import Accordion from "@/shared/components/Accordion.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import Document from "@/assets/icons/Document.vue";
import AddDocument from "@/assets/icons/AddDocument.vue";
import { useWorkspaceStore } from "../store/workspaceStore";
import { computed, ref, watch } from "vue";
import Tree from "@/shared/components/tree/Tree.vue";
import { useTreeController } from "@/shared/components/tree/baseTreeController";
import { onClickOutside } from "@vueuse/core";
import { useGlobalTabsStore } from "../store/browserTabsStore";
import { useGlobalPageStore } from "../store/globalPageStore";
import LoadingSpinner from "@/shared/components/LoadingSpinner.vue";
import { useGlobalNavigation } from "../store/navigationStore";

const treeRef = ref();
const globalPageStore = useGlobalPageStore();
const treeController = useTreeController(globalPageStore.treeStructure);
const globalNavigationStore = useGlobalNavigation();
const workSpaceStore = useWorkspaceStore();
const tabStore = useGlobalTabsStore();
const isSidebarOpen = computed(() => workSpaceStore.isSidebarOpen);

globalPageStore.refreshTreeStructure();

treeController.setRenameCallBack((id, newTitle) => {
  globalPageStore.rename(id, newTitle);
});

treeController.setMoveCallBack((id, newParentId, oldParentId, type) => {
  globalPageStore.move(id, newParentId, oldParentId);
});

onClickOutside(treeRef, () => {
  if (treeController.selectedId.value !== tabStore.activeTab?.id) {
    treeController.clearSelection();
  }
});

watch(
  () => globalPageStore.treeStructure,
  (root) => {
    if (root) {
      treeController.setRootNode(root);
    }
  },
);

watch(
  () => treeController.selectedId.value,
  (pageId) => {
    if (pageId) {
      globalNavigationStore.openPage(pageId);
    }
  },
);

watch(
  () => tabStore.activeTab,
  (tab) => {
    //console.log(tab);
    if (tab) {
      globalNavigationStore.openPage(tab.id);
    } else {
      globalNavigationStore.clearPageSelection();
    }
  },
);

watch(
  () => globalNavigationStore.activePage,
  (pageMeta) => {
    //console.log(pageMeta);
    if (pageMeta) {
      treeController.selectNode(pageMeta.id);
      const res = tabStore.openTab(pageMeta.id);
      if (!res) {
        tabStore.createTab(pageMeta);
        tabStore.openTab(pageMeta.id);
      }
    } else {
      treeController.clearSelection();
      tabStore.clearSelection();
    }
  },
);

const complexMenuData: MenuGroup[] = [
  {
    title: "Account",
    items: [
      { type: "button", label: "Profile", icon: Document },
      { type: "divider" },
      { type: "button", label: "Settings", icon: Document },
    ],
  },
];

const onCreateEmptyPage = () => {
  globalPageStore.createEmptyPage(tabStore.activeTab?.id);
};

const treeHierarchyMenu: MenuGroup[] = [
  {
    title: "Hierarchy",
    items: [
      {
        type: "button",
        label: "Create",
        icon: Document,
        action: onCreateEmptyPage,
      },
    ],
  },
];
</script>

<template>
  <div class="flex flex-col">
    <BaseButton
      class="w-full"
      :is-content-visible="isSidebarOpen"
      @click="workSpaceStore.toggleOmniSearch"
      :icon="Search"
      data-search-trigger
    >
      Search
    </BaseButton>
    <BaseButton
      class="w-full"
      :is-content-visible="isSidebarOpen"
      :icon="TypeDictionary"
    >
      Type
    </BaseButton>
    <BaseButton
      class="w-full"
      :is-content-visible="isSidebarOpen"
      :icon="Graph"
    >
      Data views
    </BaseButton>

    <div v-show="isSidebarOpen">
      <Accordion label="Fast Actions" :menu-data="complexMenuData">
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example action 1
        </BaseButton>
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example action 2
        </BaseButton>
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example action 3
        </BaseButton>
      </Accordion>

      <Accordion label="Pinned" :menu-data="complexMenuData">
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example document 1
        </BaseButton>
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example document 2
        </BaseButton>
        <BaseButton
          class="w-full"
          :is-content-visible="isSidebarOpen"
          :icon="AddDocument"
        >
          Example document 3
        </BaseButton>
      </Accordion>

      <Accordion label="Tree" :menu-data="treeHierarchyMenu">
        <Tree
          v-if="!globalPageStore.isTreeStructureLoading"
          ref="treeRef"
          :controller="treeController"
        />
        <LoadingSpinner v-else class="w-full h-5.5 algin-self-center" />
      </Accordion>
    </div>
  </div>
</template>
