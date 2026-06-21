<script setup lang="ts">
import { ref, watch, toRaw, onBeforeUnmount } from "vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore.ts";
import BaseEditor from "../components/editor/views/BaseEditor.vue";
import {
  isAnyContainer,
  type EpContainerObjectEntity,
  type EpObjectEntity,
} from "@/core/domain/type.ts";
import { useBaseEditorController } from "../components/editor/baseEditorController.ts";
import { useGlobalObjectStore } from "@/core/store/globalObjectStore.ts";
import { type EpObjectId } from "@/core/types.ts";
import { useRoute } from "vue-router";
import { useGlobalNavigation } from "@/core/store/navigationStore.ts";
import { usePageEditorStore } from "../store/pageEditorStore.ts";
import { tiptapDocToEntities } from "../components/editor/mappers.ts";
import { mapObjectEntitiesToContent } from "../components/editor/helpers.ts";

const route = useRoute();
const pageId = ref<EpObjectId>();

const props = defineProps();
const pageStore = usePageEditorStore();
const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();

const globalObjectStore = useGlobalObjectStore();

const editorController = useBaseEditorController();

const currentPageEntity = ref<EpContainerObjectEntity>();
const title = ref<string>();
const selectedObjectId = ref<EpObjectId>();
let isFirst = true;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let maxWaitTimer: ReturnType<typeof setInterval> | null = null;

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      isFirst = true;
      pageId.value = id as EpObjectId;
      pageStore.get(pageId.value);
    }
  },
  { immediate: true },
);

watch(
  () => pageStore.pageData,
  (_newData) => {
    const newData = toRaw(_newData);

    if (newData && isAnyContainer(newData)) {
      globalNavigationStore.setCurrentPath(pageStore.paths[newData.id]);
      workSpaceStore.setLoadingStatus(false);

      if (isFirst) {
        currentPageEntity.value = { ...newData };
        title.value = newData.content.title;

        console.log("Встановлено початкові дані:", currentPageEntity.value);
        editorController.setInitialData(currentPageEntity.value);

        isFirst = false;
      }
    } else {
      globalNavigationStore.clearCurrentPath();
      if (isFirst) {
        currentPageEntity.value = undefined;
      }
    }
  },
);

const performSave = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (maxWaitTimer) {
    clearTimeout(maxWaitTimer);
    maxWaitTimer = null;
  }

  const value = editorController.draftData.value;
  if (!value) return;

  console.log("Performing save");

  const data = tiptapDocToEntities(value);

  if (currentPageEntity.value) {
    const payloadToSave = {
      ...currentPageEntity.value,
      content: {
        ...currentPageEntity.value.content,
        inlineObjects: toRaw(mapObjectEntitiesToContent(data.content)),
        order: toRaw(data.order),
      },
    };

    pageStore.update(payloadToSave as EpObjectEntity);
  }
};

watch(
  editorController.draftData,
  (_data) => {
    console.log("Draft updated.");

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(performSave, 800);

    if (!maxWaitTimer) {
      maxWaitTimer = setTimeout(performSave, 5000);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (maxWaitTimer) clearInterval(maxWaitTimer);

  if (editorController.draftData.value) {
    performSave();
  }
});

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
  <div
    v-if="editorController.initialData.value"
    class="flex flex-col gap-2 w-full h-full page"
  >
    <h1>{{ title }}</h1>
    <BaseEditor
      :controller="editorController"
      v-if="currentPageEntity"
      :initial="editorController.initialData.value"
    ></BaseEditor>
    <div class="h-80 shrink-0"></div>
  </div>
  <div
    v-else
    class="flex flex-col gap-2 w-full h-full page justify-center place-content-center"
  >
    <p>Page with id {{ pageId }} doesnt exit</p>
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
