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
import { computed, markRaw, watch } from "vue";
import Tree from "@/shared/components/tree/Tree.vue";
import { useTreeController } from "@/shared/components/tree/baseTreeController";
import { useGlobalPageStore } from "../store/globalPageStore";
import LoadingSpinner from "@/shared/components/LoadingSpinner.vue";
import { useGlobalNavigation } from "../store/navigationStore";
import type { TreeMenuGroup } from "@/shared/components/tree/type";
import {
  isObjectPageMeta,
  isSystemPageMeta,
  isTypePageMeta,
  type EpObjectId,
} from "../types";
import { useRoute, useRouter } from "vue-router";
import { useGlobalTypeStore } from "../store/globalTypeStore";

const router = useRouter();
const route = useRoute();

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
const globalTypeStore = useGlobalTypeStore();

const objectTreeController = useTreeController(globalPageStore.treeStructure);
const typeTreeController = useTreeController(globalTypeStore.treeStructure);
typeTreeController.setIsDraggable(false);

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
        action() {},
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

objectTreeController.setMenuItems(treeItemsGroup);

objectTreeController.setRenameCallBack((id, newTitle) => {
  globalPageStore.rename(id, newTitle);
});

objectTreeController.setMoveCallBack((id, newParentId, oldParentId, _type) => {
  globalPageStore.move(id, newParentId, oldParentId);
});

watch(
  () => route.fullPath,
  (path) => {
    console.log(path);
  },
);

watch(
  () => globalNavigationStore.activePage,
  (pageMeta) => {
    if (pageMeta) {
      if (isSystemPageMeta(pageMeta)) {
        globalNavigationStore.openSystemPage(pageMeta.id);
        if (pageMeta.id === "type-graph") {
          router.push({ name: "type-graph" });
        }
        objectTreeController.clearSelection();
      } else if (isObjectPageMeta(pageMeta)) {
        objectTreeController.selectNode(pageMeta.id);
        router.push({ name: "page-editor", params: { id: pageMeta.id } });
      } else if (isTypePageMeta(pageMeta)) {
        router.push({
          name: "type-editor",
          params: {
            id: pageMeta.id,
          },
        });
      }
    } else {
      objectTreeController.clearSelection();
      typeTreeController.clearSelection();
      router.push({ name: "workspace" });
    }
  },
);

watch(
  () => globalPageStore.treeStructure,
  (root) => {
    if (root) {
      objectTreeController.setRootNode(root);
    }
  },
);

watch(
  () => globalTypeStore.treeStructure,
  (root) => {
    if (root) {
      typeTreeController.setRootNode(root);
    }
  },
);

watch(
  () => objectTreeController.selectedId.value,
  (pageId) => {
    if (pageId) {
      globalNavigationStore.openPage(pageId);
    }
  },
);

watch(
  () => typeTreeController.selectedId.value,
  (typeId) => {
    if (typeId) {
      globalNavigationStore.openType(typeId);
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

const onTypeEditorClicked = () => {
  if (route.name !== "type-graph") {
    globalNavigationStore.openSystemPage("type-graph");
  }
};

globalPageStore.refreshTreeStructure();
globalTypeStore.refreshTreeStructure();
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
      @click="onTypeEditorClicked"
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

      <Accordion label="Types" :menu-data="treeHierarchyMenu">
        <Tree
          v-if="!globalTypeStore.isTreeStructureLoading"
          :controller="typeTreeController"
        />
        <LoadingSpinner v-else class="w-full h-5.5 algin-self-center" />
      </Accordion>

      <Accordion label="Objects" :menu-data="treeHierarchyMenu">
        <Tree
          v-if="!globalPageStore.isTreeStructureLoading"
          :controller="objectTreeController"
        />
        <LoadingSpinner v-else class="w-full h-5.5 algin-self-center" />
      </Accordion>
    </div>
  </div>
</template>
