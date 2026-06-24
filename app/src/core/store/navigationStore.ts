import { defineStore } from "pinia";
import { ref } from "vue";
import {
  TypeEditorPageMeta,
  type EpObjectId,
  type EpTypeId,
  type Icon,
  type ObjectMeta,
  type PageMeta,
  type Path,
  type SystemPageId,
} from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";
import { resolveTitle } from "../domain/type";

export const useGlobalNavigation = defineStore("navigation", () => {
  const active = ref<PageMeta>();
  const cachedPageMeta = ref<Map<EpObjectId, ObjectMeta>>(new Map());
  const currentPath = ref<Path[]>([]);

  function setCurrentPath(els?: Path[]) {
    if (els == null) {
      currentPath.value = [];
      return;
    }
    currentPath.value = els;
  }

  const pageToMeta = async (
    objId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    const result = await globalObjectsService.get(objId);

    if (!result) {
      return undefined;
    }

    const type = await globalTypingService.get(result.typeId);

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
      kind: "page",
    } as ObjectMeta;

    return meta;
  };

  const preloadPageMeta = async (
    objId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    if (cachedPageMeta.value.has(objId)) {
      return cachedPageMeta.value.get(objId);
    }

    const meta = await pageToMeta(objId);
    if (meta) {
      cachedPageMeta.value.set(objId, meta);
    }

    return meta;
  };

  const getMetaInfo = (pageId: EpObjectId): ObjectMeta | undefined => {
    return cachedPageMeta.value.get(pageId);
  };

  const updateMeta = async (
    pageId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    const meta = await pageToMeta(pageId);
    if (meta) {
      cachedPageMeta.value.set(pageId, meta);
    }
    return meta;
  };

  const openSystemPage = (page: SystemPageId) => {
    if (page === "type-graph") {
      active.value = TypeEditorPageMeta;
    } else {
      active.value = undefined;
    }
  };

  const openType = async (typeId: EpTypeId) => {
    const type = await globalTypingService.get(typeId);
    if (!type) {
      return;
    }

    active.value = {
      id: type.id,
      title: type.title,
      icon: type.icon ?? { type: "default", name: "object" },
      kind: "type",
    };
  };

  const openPage = async (pageId: EpObjectId) => {
    let meta = getMetaInfo(pageId);

    if (!meta) {
      meta = await preloadPageMeta(pageId);
    }

    if (meta !== undefined) {
      active.value = meta;
    }
  };

  const closePage = (pageId: EpObjectId) => {
    if (pageId === active.value?.id) {
      active.value = undefined;
    }
  };

  const clearPageSelection = () => {
    active.value = undefined;
  };

  const clearCurrentPath = () => {
    currentPath.value = [];
  };

  return {
    activePage: active,
    currentPath,

    updateMeta,
    setCurrentPath,
    clearCurrentPath,
    clearPageSelection,
    getMetaInfo,
    preloadPageMeta,
    openPage,
    openType,
    openSystemPage,
    closePage,
  };
});
