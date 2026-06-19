import { defineStore } from "pinia";
import { ref, toRaw } from "vue";
import { isContainerEntity, type EpObjectEntity } from "../domain/type";
import type { TreeNode } from "@/shared/components/tree/contract";
import type { EpObjectId, ObjectPath } from "../types";
import { globalObjectsService } from "../di/global";

export const useGlobalPageStore = defineStore("page", () => {
  const treeStructure = ref<TreeNode>({ id: "-1", title: "-1", children: [] });
  const currentObject = ref<EpObjectEntity>();
  const paths = ref<Record<EpObjectId, ObjectPath>>({});
  const isOjectSaving = ref(false);
  const isObjectLoading = ref(false);
  const isTreeStructureLoading = ref(false);

  const rename = async (objId: EpObjectId, newTitle: string) => {
    isObjectLoading.value = true;
    isOjectSaving.value = true;
    const result = await globalObjectsService.get(objId);
    if (result && isContainerEntity(result)) {
      result.content.title = newTitle;
      await globalObjectsService.update(objId, result);
      await refreshTreeStructure();
    }
    isObjectLoading.value = false;
    isOjectSaving.value = false;
  };

  const create = async (
    parentId: EpObjectId | undefined,
    obj: EpObjectEntity,
  ) => {
    isObjectLoading.value = true;
    await globalObjectsService.create(parentId, obj);
    isObjectLoading.value = false;
  };

  const createEmptyPage = async (parentId: EpObjectId | undefined) => {
    isObjectLoading.value = true;
    await globalObjectsService.createEmpty(parentId, "sys:container");
    isObjectLoading.value = false;
    await refreshTreeStructure();
  };

  const update = async (newEntity: EpObjectEntity) => {
    if (currentObject.value !== undefined) {
      const res = toRaw(newEntity);
      await globalObjectsService.update(currentObject.value.id, res);
      await refreshTreeStructure();
    }
  };

  const move = async (
    movedId: EpObjectId,
    newParentId: EpObjectId,
    oldParentId: EpObjectId,
  ) => {
    isObjectLoading.value = true;
    await globalObjectsService.move(movedId, newParentId, oldParentId);
    isObjectLoading.value = false;
  };

  const get = async (id: EpObjectId) => {
    isObjectLoading.value = true;
    const result = await globalObjectsService.get(id);
    if (result) {
      currentObject.value = result;
    }
    isObjectLoading.value = false;
  };

  const refreshTreeStructure = async () => {
    isTreeStructureLoading.value = true;
    const result = await globalObjectsService.getFileTree();
    treeStructure.value = result;
    isTreeStructureLoading.value = false;
  };

  const clearActiveObject = async () => {
    currentObject.value = undefined;
  };

  return {
    isPageSaving: isOjectSaving,
    isPageLoading: isObjectLoading,
    isTreeStructureLoading,
    pageData: currentObject,
    treeStructure,
    paths,

    clearActiveObject,
    refreshTreeStructure,
    update,
    get,
    create,
    createEmptyPage,
    rename,
    move,
  };
});
