import { defineStore } from "pinia";
import { ref, toRaw } from "vue";
import type { EpObjectEntity } from "../domain/type";
import type { TreeNode } from "@/shared/components/tree/contract";
import type { EpObjectId, ObjectPath } from "../types";
import { globalObjectsService } from "../di/global";

export const useGlobalPageStore = defineStore("page", () => {
  const treeStructure = ref<TreeNode>({ id: "root", title: "a", children: [] });
  const currentObject = ref<EpObjectEntity>();
  const paths = ref<Record<EpObjectId, ObjectPath>>({});
  const isOjectSaving = ref(false);
  const isObjectLoading = ref(false);
  const isTreeStructureLoading = ref(false);

  const rename = async (objId: EpObjectId, newTitle: string) => {
    isObjectLoading.value = true;
    const result = await globalObjectsService.get(objId);
    if (result) {
      result.content.title = newTitle;
      await globalObjectsService.update(objId, result);
      await refreshTreeStructure();
    }
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
    await globalObjectsService.createEmpty(parentId, "sys:page");
    isObjectLoading.value = false;
    await refreshTreeStructure();
  };

  const update = async (newEntity: EpObjectEntity) => {
    if (currentObject.value !== undefined) {
      const res = toRaw(newEntity);
      //console.log(res);
      await globalObjectsService.update(currentObject.value.id, res);
      await refreshTreeStructure();
    }
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
    //console.log(result);
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
  };
});
