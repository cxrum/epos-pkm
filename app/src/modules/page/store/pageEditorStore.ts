import { defineStore } from "pinia";
import { ref } from "vue";
import type { EpObjectId, ObjectPath, Path } from "@/core/types";
import { globalObjectsService } from "@/core/di/global";
import {
  isAnyContainer,
  isContainerEntity,
  type EpObjectEntity,
} from "@/core/domain/type";
import { applicationBus } from "@/bus/application";

export const usePageEditorStore = defineStore("page", () => {
  const currentObject = ref<EpObjectEntity>();
  const pagePath = ref<ObjectPath>();

  const focusedObjectId = ref<EpObjectId>();
  const focusedObject = ref<EpObjectEntity>();

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
      applicationBus.emit("object:update", { id: objId });
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
      const _pagePath = await globalObjectsService.getObjectAncestors(
        result.id,
      );
      if (isAnyContainer(result)) {
        _pagePath.push({
          id: result.id,
          title: result.content.title,
        });
      }
      pagePath.value = _pagePath;
    }
    isObjectLoading.value = false;
  };

  const clearActiveObject = async () => {
    currentObject.value = undefined;
  };

  const focusObject = async (id: EpObjectId) => {
    focusedObjectId.value = id;
    focusedObject.value = await globalObjectsService.get(id);
  };

  const clearFocusObject = () => {
    focusedObject.value = undefined;
    focusedObject.value = undefined;
  };

  return {
    focusedObject,

    isOjectSaving,
    isObjectLoading,
    currentObject,
    paths,
    pagePath,

    focusObject,
    clearFocusObject,
    clearActiveObject,
    update,
    get,
    create,
    rename,
  };
});
