import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, Icon, ObjectMeta, Path } from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";
import { isContainerEntity, resolveTitle } from "../domain/type";

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

  const preloadPageMeta = async (
    objId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    if (cachedPageMeta.value.has(objId)) {
      return cachedPageMeta.value.get(objId);
    }

    const result = await globalObjectsService.get(objId);

    if (!result) {
      return undefined;
    }

    const type = await globalTypingService.getType(result.typeId);

    let icon: Icon = { type: "emoji", emoji: "U" };
    let title: string = resolveTitle(result);

    if (type) {
      icon = type.icon ?? { type: "default", name: "object" };
    }

    const meta = {
      id: objId,
      typeId: result.typeId,
      title: title,
      icon: icon,
    } as ObjectMeta;

    cachedPageMeta.value.set(objId, meta);

    return meta;
  };

  const getMetaInfo = (pageId: EpObjectId): ObjectMeta | undefined => {
    return cachedPageMeta.value.get(pageId);
  };

  const openPage = async (pageId: EpObjectId) => {
    let meta = getMetaInfo(pageId);

    if (!meta) {
      meta = await preloadPageMeta(pageId);
    }

    if (meta !== undefined) {
      activePage.value = meta;
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
