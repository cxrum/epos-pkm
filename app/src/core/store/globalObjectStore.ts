import { defineStore } from "pinia";
import type { EpObjectId, Icon } from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";
import { ref, type Ref } from "vue";
import { isAnyContainer, isContainerEntity } from "../domain/type";
import type { TreeNode } from "@/shared/components/tree/contract";
import { applicationBus } from "@/bus/application";

export interface ObjectMetaInfo {
  icon?: Icon;
  title?: string;
  path?: string;
}

export const useGlobalObjectStore = defineStore("objects", () => {
  const treeStructure = ref<TreeNode>({ id: "-1", title: "-1", children: [] });
  const isOjectSaving = ref(false);
  const isTreeStructureLoading = ref(false);

  const isObjectLoading = ref(new Map<EpObjectId, boolean>());
  const selectedObject: Ref<EpObjectId | undefined> = ref(undefined);

  const setSelectedObject = async (id: EpObjectId) => {
    selectedObject.value = id;
  };

  const getMetaInfo = async (id: EpObjectId): Promise<ObjectMetaInfo> => {
    isObjectLoading.value.set(id, true);
    const res = await globalObjectsService.get(id);
    const typeRes = await globalTypingService.get(id);
    isObjectLoading.value.set(id, false);

    let title = undefined;

    if (res && isAnyContainer(res)) {
      title = res.content.title;
    }

    return {
      icon: typeRes?.icon,
      title: title,
      path: res?.objectPath.join("/"),
    };
  };

  const rename = async (objId: EpObjectId, newTitle: string) => {
    isOjectSaving.value = true;
    const result = await globalObjectsService.get(objId);
    if (result && isContainerEntity(result)) {
      result.content.title = newTitle;
      await globalObjectsService.update(objId, result);
      applicationBus.emit("object:update", { id: objId });
    }
    isOjectSaving.value = false;
  };

  const createEmptyPage = async (parentId: EpObjectId | undefined) => {
    isOjectSaving.value = true;
    await globalObjectsService.createEmpty(parentId, "sys:container");
    isOjectSaving.value = false;
    await refreshTreeStructure();
  };

  const move = async (
    movedId: EpObjectId,
    newParentId: EpObjectId,
    oldParentId: EpObjectId,
  ) => {
    isOjectSaving.value = true;
    await globalObjectsService.move(movedId, newParentId, oldParentId);
    isOjectSaving.value = false;
  };

  const refreshTreeStructure = async () => {
    isTreeStructureLoading.value = true;
    const result = await globalObjectsService.getFileTree();
    treeStructure.value = result;
    isTreeStructureLoading.value = false;
  };

  return {
    selectedObject,
    isObjectLoading,
    treeStructure,
    isTreeStructureLoading,

    refreshTreeStructure,
    setSelectedObject,
    createEmptyPage,
    getMetaInfo,
    move,
    rename,
  };
});
