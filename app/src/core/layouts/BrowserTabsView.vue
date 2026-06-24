<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Tab from "@/core/components/Tab.vue";
import { useGlobalTabsStore } from "@/core/store/browserTabsStore";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import { type MetaId } from "../types";
import { useGlobalNavigation } from "../store/navigationStore";
import { applicationBus } from "@/bus/application";
import { useWorkspaceStore } from "../store/workspaceStore";
import type { SavedTab } from "../domain/workspace";

const globalNavigationStore = useGlobalNavigation();
const globalTabStore = useGlobalTabsStore();
const workspaceStore = useWorkspaceStore();

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
      globalNavigationStore.open(tab);
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

const handleObjectUpdate = async (it: { id: string }) => {
  if (it) {
    const obj = await globalNavigationStore.updateMeta(it.id);
    if (obj) {
      globalTabStore.updateMeta(it.id, obj);
    }
  }
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const preload = async () => {
  const state = await workspaceStore.state();

  if (state.savedTabs.length > 0) {
    const promises = state.savedTabs.map((tab) =>
      globalNavigationStore.preloadMeta(tab),
    );
    const metas = await Promise.all(promises);
    const validMetas = metas.filter((meta) => meta !== undefined);
    let lastActiveTab = undefined;
    if (state.lastActiveTab) {
      lastActiveTab = await globalNavigationStore.preloadMeta(
        state.lastActiveTab,
      );
    }

    globalTabStore.preload(validMetas, lastActiveTab);
  }
};

watch(
  () => globalTabStore.openedTabs,
  (openedTabs) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      const _res: SavedTab[] = Array.from(openedTabs.values()).map((it) => ({
        id: it.id,
        kind: it.kind,
      }));

      await workspaceStore.saveTabs(_res);
    }, 1000);
  },
  { deep: true },
);

watch(
  () => globalTabStore.activeTab,
  (tab) => {
    if (!tab) return;
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      await workspaceStore.saveLastActiveTab({
        id: tab.id,
        kind: tab.kind,
      });
    }, 1000);
  },
  { deep: true },
);

onMounted(async () => {
  applicationBus.on("object:update", handleObjectUpdate);
  await preload();
});

onUnmounted(() => {
  applicationBus.off("object:update", handleObjectUpdate);

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});
</script>

<template>
  <div
    ref="scrollContainer"
    @wheel="handleHorizontalScroll"
    class="flex w-full h-full items-center mx-auto overflow-x-auto no-scrollbar"
  >
    <Tab
      v-for="page in globalTabStore.openedTabs.values()"
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
