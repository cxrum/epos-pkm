import { defineStore } from "pinia";
import type { EpObjectId, Icon } from "../types";
import { globalObjectsService, globalTypingService } from "../di/global";
import { ref, type Ref } from "vue";
import { isAnyContainer } from "../domain/type";

export interface ObjectMetaInfo {
  icon?: Icon;
  title?: string;
  path?: string;
}

export const useGlobalObjectStore = defineStore("objects", () => {
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

  return {
    selectedObject,
    isObjectLoading,

    setSelectedObject,
    getMetaInfo,
  };
});
