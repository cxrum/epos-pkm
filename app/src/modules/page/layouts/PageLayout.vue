<script setup lang="ts">
import { ref, watch } from "vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore.ts";
import { useGlobalPageStore } from "../../../core/store/globalPageStore.ts";
import BaseEditor from "../components/editor/views/BaseEditor.vue";
import { useGlobalNavigation } from "@/core/store/navigationStore.ts";
import type { EpObjectEntity } from "@/core/domain/type.ts";

const props = defineProps();
const pageStore = useGlobalPageStore();
const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();

const currentPageEntity = ref<EpObjectEntity>();
const firstOpen = ref<boolean>(true);

watch(
  () => globalNavigationStore.activePage,
  (activePage) => {
    if (activePage != null) {
      pageStore.get(activePage.id);
      workSpaceStore.setLoadingStatus(true);
    } else {
      pageStore.clearActiveObject();
    }
  },
  { deep: true },
);

watch(
  () => pageStore.pageData,
  (newData) => {
    if (newData) {
      globalNavigationStore.setCurrentPath(pageStore.paths[newData.id]);
      currentPageEntity.value = newData;
      workSpaceStore.setLoadingStatus(false);
    } else {
      globalNavigationStore.clearCurrentPath();
    }
  },
);

watch(
  currentPageEntity,
  (newData) => {
    if (!newData) return;
    if (firstOpen.value) {
      firstOpen.value = false;
      return;
    }

    pageStore.update(newData);
  },
  { deep: true },
);
</script>

<template>
  <div v-if="pageStore.pageData" class="flex flex-col gap-2 w-full h-full page">
    <h1>{{ pageStore.pageData.content.title }}</h1>
    <BaseEditor
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
