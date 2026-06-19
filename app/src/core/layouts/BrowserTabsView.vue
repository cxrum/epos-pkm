<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Tab from "@/core/components/Tab.vue";
import { useGlobalTabsStore } from "@/core/store/browserTabsStore";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import {
  isObjectPageMeta,
  isSystemPageMeta,
  isTypePageMeta,
  type MetaId,
} from "../types";
import { useGlobalNavigation } from "../store/navigationStore";

const globalNavigationStore = useGlobalNavigation();
const globalTabStore = useGlobalTabsStore();

const activePageId = computed(() => {
  return globalTabStore.activeTab?.id;
});

const props = defineProps();

const scrollContainer = ref<HTMLElement | null>(null);

const handleHorizontalScroll = (event: WheelEvent) => {
  if (!scrollContainer.value) return;

  if (event.deltaY !== 0) {
    event.preventDefault();
    scrollContainer.value.scrollLeft += event.deltaY;
  }
};

const onClosePageClick = (pageId: MetaId) => {
  globalTabStore.closeTab(pageId);
};

const onTabClick = (pageId: MetaId) => {
  globalTabStore.openTab(pageId);
};

watch(
  () => globalTabStore.activeTab,
  (tab) => {
    if (tab) {
      if (isSystemPageMeta(tab)) {
        globalNavigationStore.openSystemPage(tab.id);
      } else if (isObjectPageMeta(tab)) {
        globalNavigationStore.openPage(tab.id);
      } else if (isTypePageMeta(tab)) {
        globalNavigationStore.openType(tab.id);
      }
    } else {
      globalNavigationStore.clearPageSelection();
    }
  },
);

watch(
  () => globalNavigationStore.activePage,
  (pageMeta) => {
    if (pageMeta) {
      const res = globalTabStore.openTab(pageMeta.id);
      if (!res) {
        globalTabStore.createTab(pageMeta);
        globalTabStore.openTab(pageMeta.id);
      }
    } else {
      globalTabStore.clearSelection();
    }
  },
);
</script>

<template>
  <div
    ref="scrollContainer"
    @wheel="handleHorizontalScroll"
    class="flex w-full h-full items-center mx-auto overflow-x-auto no-scrollbar"
  >
    <Tab
      v-for="page in globalTabStore.openedTabs"
      :id="page.id"
      :active="activePageId === page.id"
      @close="onClosePageClick"
      @tab-click="onTabClick"
    >
      <template #icon>
        <DynamicIcon
          :icon="page.icon"
          class="w-5 h-5 shrink-0 text-(--icon-color)"
        />
      </template>

      {{ page.title }}
    </Tab>
  </div>
</template>
