<script setup lang="ts">
import BaseButton from "@/shared/components/BaseButton.vue";
import Search from "@/assets/icons/Search.vue";
import TypeDictionary from "@/assets/icons/TypeDictionary.vue";
import Graph from "@/assets/icons/Graph.vue";
import Accordion from "@/shared/components/Accordion.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import AddDocument from "@/assets/icons/AddDocument.vue";
import { useWorkspaceStore } from "../store/workspaceStore";
import { computed, markRaw, ref, watch } from "vue";
import Tree from "@/shared/components/tree/Tree.vue";
import { useTreeController } from "@/shared/components/tree/baseTreeController";
import { useGlobalPageStore } from "../store/globalPageStore";
import LoadingSpinner from "@/shared/components/LoadingSpinner.vue";
import { useGlobalNavigation } from "../store/navigationStore";
import type { TreeMenuGroup } from "@/shared/components/tree/type";
import type { EpObjectId } from "../types";

const stubMenuGroup: MenuGroup[] = [
  {
    title: "Stub",
    items: [
      { type: "button", label: "Stub", icon: DocumentIcon },
      { type: "divider" },
      { type: "button", label: "Stub", icon: DocumentIcon },
    ],
  },
];

const globalPageStore = useGlobalPageStore();
const treeController = useTreeController(globalPageStore.treeStructure);
const globalNavigationStore = useGlobalNavigation();
const workSpaceStore = useWorkspaceStore();
const isSidebarOpen = computed(() => workSpaceStore.isSidebarOpen);

const createEmptyPageInside = (parentId: EpObjectId) => {
  globalPageStore.createEmptyPage(parentId);
};

const onCreateEmptyPageRoot = () => {
  globalPageStore.createEmptyPage(undefined);
};

const treeItemsGroup: TreeMenuGroup = [
  {
    items: [
      {
        type: "button",
        label: "Remove",
        icon: markRaw(DocumentIcon),
        action(context) {
          console.log(context);
        },
      },
      {
        type: "button",
        label: "Create page",
        icon: markRaw(DocumentIcon),
        action(context) {
          createEmptyPageInside(context.id);
        },
      },
    ],
  },
];

treeController.setMenuItems(treeItemsGroup);

globalPageStore.refreshTreeStructure();

treeController.setRenameCallBack((id, newTitle) => {
  globalPageStore.rename(id, newTitle);
});

treeController.setMoveCallBack((id, newParentId, oldParentId, type) => {
  globalPageStore.move(id, newParentId, oldParentId);
});

watch(
  () => globalNavigationStore.activePage,
  (pageMeta) => {
    if (pageMeta) {
      treeController.selectNode(pageMeta.id);
    } else {
      treeController.clearSelection();
    }
  },
);

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

const treeHierarchyMenu: MenuGroup[] = [
  {
    title: "Hierarchy",
    items: [
      {
        type: "button",
        label: "Create",
        icon: DocumentIcon,
        action: onCreateEmptyPageRoot,
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
      <Accordion label="Fast Actions" :menu-data="stubMenuGroup">
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

      <Accordion label="Pinned" :menu-data="stubMenuGroup">
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
          :controller="treeController"
        />
        <LoadingSpinner v-else class="w-full h-5.5 algin-self-center" />
      </Accordion>
    </div>
  </div>
</template>
