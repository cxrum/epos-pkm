import { defineStore } from "pinia";
import { ref } from "vue";
import {
  isObjectPageMeta,
  isSystemPageMeta,
  isTypePageMeta,
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
import type { SavedTab } from "../domain/workspace";

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

  const clearCurrentPath = () => {
    currentPath.value = [];
  };

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

    return {
      id: objId,
      typeId: result.typeId,
      title: title,
      icon: icon,
      kind: "page",
    } as ObjectMeta;
  };

  const preloadSystemPageMeta = (
    pageId: SystemPageId,
  ): PageMeta | undefined => {
    if (pageId === "type-graph") {
      return TypeEditorPageMeta;
    }
    return undefined;
  };

  const openSystemPage = (pageId: SystemPageId) => {
    const meta = preloadSystemPageMeta(pageId);
    if (meta) {
      active.value = meta;
    } else {
      active.value = undefined;
    }
  };

  const preloadTypePageMeta = async (
    typeId: EpTypeId,
  ): Promise<PageMeta | undefined> => {
    const type = await globalTypingService.get(typeId);
    if (!type) {
      return undefined;
    }

    return {
      id: type.id,
      title: type.title,
      icon: type.icon ?? { type: "default", name: "object" },
      kind: "type",
    } as PageMeta;
  };

  const openType = async (typeId: EpTypeId) => {
    const meta = await preloadTypePageMeta(typeId);
    if (meta) {
      active.value = meta;
    }
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

  const openPage = async (pageId: EpObjectId) => {
    const meta = await preloadPageMeta(pageId);
    if (meta) {
      active.value = meta;
    }
  };

  const preloadMeta = async (tab: SavedTab): Promise<PageMeta | undefined> => {
    switch (tab.kind) {
      case "system":
        return preloadSystemPageMeta(tab.id);
      case "type":
        return await preloadTypePageMeta(tab.id);
      case "page":
        return await preloadPageMeta(tab.id);
    }
  };

  const open = async (meta: PageMeta): Promise<void> => {
    if (isSystemPageMeta(meta)) {
      openSystemPage(meta.id);
    } else if (isObjectPageMeta(meta)) {
      await openPage(meta.id);
    } else if (isTypePageMeta(meta)) {
      await openType(meta.id);
    }
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

  const closePage = (pageId: EpObjectId) => {
    if (pageId === active.value?.id) {
      active.value = undefined;
    }
  };

  const clearPageSelection = () => {
    active.value = undefined;
  };

  return {
    activePage: active,
    currentPath,

    updateMeta,
    setCurrentPath,
    clearCurrentPath,
    clearPageSelection,
    getMetaInfo,

    open,
    preloadMeta,

    preloadSystemPageMeta,
    openSystemPage,

    preloadTypePageMeta,
    openType,

    preloadPageMeta,
    openPage,

    closePage,
  };
});
