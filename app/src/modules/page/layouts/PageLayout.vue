<script setup lang="ts">
import { ref, watch, nextTick, toRaw, onMounted } from "vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore.ts";
import { useGlobalPageStore } from "../../../core/store/globalPageStore.ts";
import BaseEditor from "../components/editor/views/BaseEditor.vue";
import { useGlobalNavigation } from "@/core/store/navigationStore.ts";
import {
  isAnyContainer,
  type EpContainerObjectEntity,
} from "@/core/domain/type.ts";
import { useBaseEditorController } from "../components/editor/baseEditorController.ts";
import { useGlobalObjectStore } from "@/core/store/globalObjectStore.ts";
import {
  isObjectPageMeta,
  isSystemPageMeta,
  type EpObjectId,
} from "@/core/types.ts";

const props = defineProps();
const pageStore = useGlobalPageStore();
const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();
const globalObjectStore = useGlobalObjectStore();

const editorController = useBaseEditorController();

const currentPageEntity = ref<EpContainerObjectEntity>();
const title = ref<string>();
const selectedObjectId = ref<EpObjectId>();
let isProgrammaticUpdate = false;

onMounted(() => {
  if (
    globalNavigationStore.activePage &&
    isObjectPageMeta(globalNavigationStore.activePage)
  ) {
    pageStore.get(globalNavigationStore.activePage.id);
  } else {
    pageStore.clearActiveObject();
  }
});

watch(
  () => globalNavigationStore.activePage,
  (activePage) => {
    if (activePage && isObjectPageMeta(activePage)) {
      pageStore.get(activePage.id);
    } else {
      pageStore.clearActiveObject();
    }
  },
  { deep: true },
);

watch(
  () => pageStore.pageData,
  (_newData) => {
    const newData = toRaw(_newData);
    if (newData && isAnyContainer(newData)) {
      isProgrammaticUpdate = true;

      globalNavigationStore.setCurrentPath(pageStore.paths[newData.id]);
      currentPageEntity.value = newData;

      title.value = newData.content.title;
      workSpaceStore.setLoadingStatus(false);
      nextTick(() => {
        setTimeout(() => {
          isProgrammaticUpdate = false;
        }, 50);
      });
    } else {
      globalNavigationStore.clearCurrentPath();
      currentPageEntity.value = undefined;
    }
  },
);

watch(
  currentPageEntity,
  (newData) => {
    if (!newData) return;
    if (isProgrammaticUpdate) {
      return;
    }
    pageStore.update(newData);
  },
  { deep: true },
);

watch(editorController.selectedObjectId, (id) => {
  if (id !== selectedObjectId.value) {
    selectedObjectId.value = id;
    if (id) {
      globalObjectStore.setSelectedObject(id);
    }
  }
});
</script>
<template>
  <div v-if="pageStore.pageData" class="flex flex-col gap-2 w-full h-full page">
    <h1>{{ title }}</h1>
    <BaseEditor
      :controller="editorController"
      v-if="currentPageEntity"
      v-model="currentPageEntity"
    ></BaseEditor>
    <div class="h-80 shrink-0"></div>
  </div>
  <div
    v-else
    class="flex flex-col justify-center items-center gap-2 w-full h-full page"
  >
    <p>Create a new note (shortcut placeholder)</p>
    <p>Select page from tree or browser tab</p>
  </div>
</template>

<style lang="css" scoped>
.page {
  padding-left: clamp(16px, 8vw, 128px);
  padding-right: clamp(16px, 8vw, 128px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
</style>
