import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectEntity } from "../domain/type";
import type { TreeNode } from "@/shared/components/tree/contract";
import type { EpObjectId, ObjectPath } from "../types";
import { globalObjectsService } from "../di/global";

export const useGlobalPageStore = defineStore("page", () => {
  const treeStructure = ref<TreeNode>({ id: "root", title: "a", children: [] });
  const currentObject = ref<EpObjectEntity>();
  const paths = ref<Record<number, ObjectPath>>({});
  const isOjectSaving = ref(false);
  const isObjectLoading = ref(false);
  const isTreeStructureLoading = ref(false);

  const update = async (content: EpObjectEntity) => {
    if (currentObject.value !== undefined) {
      await globalObjectsService.update(content.id, content);
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
  };
});
