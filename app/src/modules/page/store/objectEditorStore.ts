import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type { EpObjectId, ObjectPath, Path } from "@/core/types";
import { globalObjectsService, globalTypingService } from "@/core/di/global";
import { type EpObjectEntity } from "@/core/domain/type";
import type {
  PropertiesScheme,
  PropertyEntry,
  ValuedPropertiesScheme,
} from "@/core/application/type";

export const useObjectEditorStore = defineStore("object-editor", () => {
  const focusedObjectId = ref<EpObjectId>();
  const focusedObject = ref<EpObjectEntity>();

  const valuedProperties = ref<ValuedPropertiesScheme>();

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

  return {
    focusedObject,
    valuedProperties,

    focusObject,
    clearFocusObject,
  };
});
