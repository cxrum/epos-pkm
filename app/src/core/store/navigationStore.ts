import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, Icon, ObjectMeta, Path } from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";

export const useGlobalNavigation = defineStore("navigation", () => {
  const activePage = ref<ObjectMeta>();
  const cachedPageMeta = ref<Map<EpObjectId, ObjectMeta>>(new Map());
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

    if (!result) {
      return;
    }

    const type = await globalTypingService.getType(result.typeId);

    let icon: Icon = { type: "emoji", emoji: "U" };
    let title: string = type?.title ?? "unknown";

    if (result) {
      if (result.typeId === "sys:page") {
        title = result.content.title;
      } else if (type) {
        icon = type.icon ?? { type: "default", name: "object" };
      }
    }

    if (result) {
      const meta = {
        id: objId,
        typeId: result.typeId,
        title: title,
        icon: icon,
      } as ObjectMeta;
      //console.log(meta);
      cachedPageMeta.value.set(objId, meta);
    }
  };

  const getMetaInfo = (pageId: EpObjectId): ObjectMeta | undefined => {
    return cachedPageMeta.value.get(pageId);
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
