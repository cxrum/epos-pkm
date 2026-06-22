import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, ObjectPath, Path } from "@/core/types";
import { globalObjectsService } from "@/core/di/global";
import { isContainerEntity, type EpObjectEntity } from "@/core/domain/type";

export const usePageEditorStore = defineStore("page", () => {
  const currentObject = ref<EpObjectEntity>();
  const pagePath = ref<ObjectPath>();

  const paths = ref<Record<EpObjectId, ObjectPath>>({});
  const isOjectSaving = ref(false);
  const isObjectLoading = ref(false);

  const rename = async (objId: EpObjectId, newTitle: string) => {
    isObjectLoading.value = true;
    isOjectSaving.value = true;
    const result = await globalObjectsService.get(objId);
    if (result && isContainerEntity(result)) {
      result.content.title = newTitle;
      await globalObjectsService.update(objId, result);
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

  const update = async (newEntity: EpObjectEntity) => {
    if (currentObject.value !== undefined) {
      const res = newEntity;
      await globalObjectsService.update(currentObject.value.id, res);
    }
  };

  const get = async (id: EpObjectId) => {
    isObjectLoading.value = true;
    const result = await globalObjectsService.get(id);
    if (result) {
      currentObject.value = result;
      console.log(result);
      pagePath.value = await globalObjectsService.getObjectAncestors(result.id);
    }
    isObjectLoading.value = false;
  };

  const clearActiveObject = async () => {
    currentObject.value = undefined;
  };

  return {
    isOjectSaving,
    isObjectLoading,
    currentObject,
    paths,
    pagePath,

    clearActiveObject,
    update,
    get,
    create,
    rename,
  };
});
