import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { EpObjectId, EpPropertyId, ObjectPath, Path } from "@/core/types";
import { globalObjectsService, globalTypingService } from "@/core/di/global";
import { type EpObjectEntity } from "@/core/domain/type";
import type { ValuedPropertiesScheme } from "@/core/application/type";

export const useObjectEditorStore = defineStore("object-editor", () => {
  const focusedObjectId = ref<EpObjectId>();
  const focusedObject = ref<EpObjectEntity>();

  const valuedProperties = ref<ValuedPropertiesScheme>();

  const propertyFieldError = ref<Map<EpPropertyId, string | undefined>>(
    new Map(),
  );

  const focusObject = async (id: EpObjectId) => {
    focusedObjectId.value = id;
    focusedObject.value = await globalObjectsService.get(id);
    valuedProperties.value =
      await globalObjectsService.getValuedObjectProps(id);
  };

  const clearFocusObject = () => {
    focusedObject.value = undefined;
    focusedObject.value = undefined;
  };

  const setPropertyErrorMsg = (id: EpPropertyId, msg: string) => {
    propertyFieldError.value.set(id, msg);
  };

  const clearPropertyErrorMsg = (id: EpPropertyId) => {
    propertyFieldError.value.set(id, undefined);
  };

  const clearErrorMsgs = () => {
    propertyFieldError.value.clear();
  };

  return {
    focusedObject,
    valuedProperties,

    propertyFieldError,

    clearPropertyErrorMsg,
    setPropertyErrorMsg,
    clearErrorMsgs,
    focusObject,
    clearFocusObject,
  };
});
