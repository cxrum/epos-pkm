import type { EpTypeId, Icon } from "../types";
import { globalTypingService } from "../di/global";
import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type { EpTypeEntity } from "../domain/type";

export interface ObjectMetaInfo {
  icon?: Icon;
  title?: string;
  path?: string;
}

export const useTypeStore = defineStore("types", () => {
  const isTypeLoading = ref<boolean>(false);
  const selectedObject: Ref<EpTypeEntity | undefined> = ref(undefined);

  const loadType = async (id: EpTypeId) => {
    isTypeLoading.value = false;
    selectedObject.value = await globalTypingService.get(id);
    isTypeLoading.value = true;
  };

  return {
    isTypeLoading,

    loadType,
  };
});
