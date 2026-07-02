<script setup lang="ts">
import {
  ref,
  watch,
  toRaw,
  onBeforeUnmount,
  computed,
  onMounted,
  onUnmounted,
  provide,
} from "vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore.ts";
import BaseEditor from "../components/editor/views/BaseEditor.vue";
import {
  isAnyContainer,
  type EpContainerObjectEntity,
  type EpObjectEntity,
} from "@/core/domain/type.ts";
import { useBaseEditorController } from "../components/editor/baseEditorController.ts";
import { type EpObjectId, type Path } from "@/core/types.ts";
import { useRoute } from "vue-router";
import { useGlobalNavigation } from "@/core/store/navigationStore.ts";
import { usePageEditorStore } from "../store/pageEditorStore.ts";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type.ts";
import Breadcrumbs from "@/core/components/Breadcrumbs.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import TypeIcon from "@/assets/icons/TypeIcon.vue";
import DotsMenu from "@/assets/icons/DotsMenu.vue";
import TypeEditorLayout from "./TypeEditorLayout.vue";
import FloatingPopUpMenu from "@/shared/components/popUpMenu/FloatingPopUpMenu.vue";
import { applicationBus } from "@/bus/application.ts";
import { useObjectEditorStore } from "../store/objectEditorStore.ts";
import { EditorControllerKey } from "../components/editor/contract.ts";

const route = useRoute();
const pageId = ref<EpObjectId>();

const props = defineProps();
const pageStore = usePageEditorStore();
const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();
const objectEditorStore = useObjectEditorStore();

const editorController = useBaseEditorController(applicationBus);
provide(EditorControllerKey, editorController);

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
  () => pageStore.currentObject,
  (_newData) => {
    const newData = toRaw(_newData);

    if (newData && isAnyContainer(newData)) {
      globalNavigationStore.setCurrentPath(pageStore.paths[newData.id]);
      workSpaceStore.setLoadingStatus(false);

      if (isFirst) {
        currentPageEntity.value = { ...newData };
        title.value = newData.content.title;

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

  const data = toRaw(value);

  if (currentPageEntity.value) {
    const payloadToSave = {
      ...currentPageEntity.value,
      content: {
        ...currentPageEntity.value.content,
        inlineObjects: toRaw(data.content.inlineObjects),
        order: toRaw(data.content.order),
      },
    };

    // pageStore.update(payloadToSave as EpObjectEntity);
  }
};

watch(
  editorController.draftData,
  (_data) => {
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
  if (maxWaitTimer) clearTimeout(maxWaitTimer);

  if (editorController.draftData.value) {
    performSave();
  }
});

watch(editorController.focusedObjectId, (id) => {
  if (id !== selectedObjectId.value) {
    selectedObjectId.value = id;
    if (id) {
      objectEditorStore.focusObject(id);
    }
  }
});

const pageMenuData: MenuGroup[] = [
  {
    title: "Page",
    items: [
      { type: "button", label: "Wtf", icon: DocumentIcon },
      { type: "divider" },
      { type: "button", label: "Wtf", icon: DocumentIcon },
    ],
  },
];

const isTypeEditorOpen = computed(() => workSpaceStore.isTypeEditorOpen);

const computedPath = computed(() => {
  return pageStore.pagePath ?? [];
});

const handleOnChainClick = (value: Path) => {
  globalNavigationStore.openPage(value.id);
};

const handleObjectUpdate = async (it: { id: string }) => {
  if (it && it.id == pageId.value) {
    isFirst = true;
    await pageStore.get(it.id);
    isFirst = false;
  }
};

onMounted(() => {
  applicationBus.on("object:update", handleObjectUpdate);
});

onUnmounted(() => {
  applicationBus.off("object:update", handleObjectUpdate);
});
</script>
<template>
  <div class="flex w-full h-full flex-row">
    <div class="flex flex-1 flex-col min-w-0">
      <nav class="flex w-full flex-col shrink-0 bg-(--bg-canvas) p-1">
        <div class="flex w-full shrink-0 items-center">
          <Breadcrumbs :path="computedPath" @chain-click="handleOnChainClick" />

          <BaseIcon
            size="28px"
            interactive
            @click="workSpaceStore.toggleTypeEditor()"
            class="text-(--icon-color) shrink-0"
            :class="isTypeEditorOpen ? 'bg-(--hover)' : ''"
          >
            <TypeIcon />
          </BaseIcon>

          <FloatingPopUpMenu :menu-data="pageMenuData" placement="bottom-end">
            <template #trigger="{ referenceRef, toggleMenu }">
              <BaseIcon
                :ref="referenceRef"
                size="28px"
                interactive
                class="text-(--icon-color)"
                @click="toggleMenu"
              >
                <DotsMenu />
              </BaseIcon>
            </template>
          </FloatingPopUpMenu>
        </div>
      </nav>

      <div
        v-if="editorController.initialData.value"
        class="flex flex-col gap-2 w-full h-full page overflow-y-auto auto-hide-scroll"
      >
        <h1>{{ title }}</h1>
        <BaseEditor
          :controller="editorController"
          v-if="currentPageEntity"
          :initial="editorController.initialData.value"
          :application-bus="applicationBus"
        ></BaseEditor>
        <div class="h-80 shrink-0"></div>
      </div>
      <div
        v-else
        class="flex flex-col gap-2 w-full h-full page justify-center place-content-center"
      >
        <p>Page with id {{ pageId }} doesnt exit</p>
      </div>
    </div>

    <div
      class="h-full w-64 p-2 border-l border-(--border) bg-(--bg-sidebar) overflow-y-auto auto-hide-scroll shrink-0"
      v-if="isTypeEditorOpen"
    >
      <TypeEditorLayout :controller="editorController" />
    </div>
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
