import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, Icon, ObjectMeta, Path } from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";

export const useGlobalNavigation = defineStore("navigation", () => {
  const activePage = ref<ObjectMeta>();
  const cachedPageMeta = ref<Record<EpObjectId, ObjectMeta>>({});
  const currentPath = ref<Path[]>([]);

  function setCurrentPath(els?: Path[]) {
    if (els == null) {
      currentPath.value = [];
      return;
    }
    currentPath.value = els;
  }

  const preloadPageMeta = async (objId: EpObjectId) => {
    const result = await globalObjectsService.get(objId);
    const type = await globalTypingService.getType(objId);

    let icon: Icon = { name: "page", type: "default" };
    let title: string = type?.title ?? "unknown";

    if (result) {
      if (result.typeId === "sys:page") {
        title = result.content.title;
      } else if (type) {
        icon = type.icon ?? { type: "default", name: "object" };
      }
    }

    activePage.value = cachedPageMeta.value[objId];
  };

  const getMetaInfo = (pageId: EpObjectId): ObjectMeta | undefined => {
    return cachedPageMeta.value[pageId];
  };

  const openPage = (pageId: EpObjectId) => {
    const meta = getMetaInfo(pageId);
    if (meta !== undefined) {
      activePage.value = meta;
    } else {
      preloadPageMeta(pageId);
    }
  };

  const closePage = (pageId: EpObjectId) => {
    if (pageId === activePage.value?.id) {
      activePage.value = undefined;
    }
  };

  const clearPageSelection = () => {
    activePage.value = undefined;
  };

  const clearCurrentPath = () => {
    currentPath.value = [];
  };

  return {
    activePage,
    currentPath,

    setCurrentPath,
    clearCurrentPath,
    clearPageSelection,
    getMetaInfo,
    preloadPageMeta,
    openPage,
    closePage,
  };
});
