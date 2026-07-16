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
import { isAnyContainer, resolveTitle } from "../domain/type";
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

  const getObjectMeta = async (
    objId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    const initialObject = await globalObjectsService.get(objId);

    if (!initialObject) {
      return undefined;
    }

    let targetEntity = initialObject;

    if (!isAnyContainer(initialObject)) {
      const parentContainer = await globalObjectsService.getParentContainer(
        initialObject.id,
      );

      if (!parentContainer) {
        return undefined;
      }

      targetEntity = parentContainer;
    }

    const type = await globalTypingService.get(targetEntity.typeId);

    let icon: Icon = { type: "emoji", emoji: "U" };
    const title: string = resolveTitle(targetEntity);

    if (type) {
      icon = type.icon ?? { type: "default", name: "object" };
    }

    return {
      id: targetEntity.id,
      typeId: targetEntity.typeId,
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

  const preloadObjectMeta = async (
    objId: EpObjectId,
  ): Promise<ObjectMeta | undefined> => {
    if (cachedPageMeta.value.has(objId)) {
      return cachedPageMeta.value.get(objId);
    }

    const meta = await getObjectMeta(objId);

    if (meta) {
      cachedPageMeta.value.set(objId, meta);
    }

    return meta;
  };

  const openObject = async (pageId: EpObjectId) => {
    const meta = await preloadObjectMeta(pageId);
    if (meta) {
      active.value = meta;
    }
  };

  const preloadMeta = async (tab: SavedTab): Promise<PageMeta | undefined> => {
    switch (tab.kind) {
      case "system":
        return preloadSystemPageMeta(tab.id as SystemPageId);
      case "type":
        return await preloadTypePageMeta(tab.id);
      case "page":
        return await preloadObjectMeta(tab.id);
    }
  };

  const open = async (meta: PageMeta): Promise<void> => {
    if (isSystemPageMeta(meta)) {
      openSystemPage(meta.id);
    } else if (isObjectPageMeta(meta)) {
      await openObject(meta.id);
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
    const meta = await getObjectMeta(pageId);
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

    preloadPageMeta: preloadObjectMeta,
    openPage: openObject,

    closePage,
  };
});
