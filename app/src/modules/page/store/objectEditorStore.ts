import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import type {
  EpObjectId,
  EpPropertyId,
  EpTypeId,
  Icon,
  ObjectPath,
  Path,
} from "@/core/types";
import { globalObjectsService, globalTypingService } from "@/core/di/global";
import {
  isAnyContainer,
  isSelectPropertyItem,
  isSelectPropertyValuedItem,
  type AutocompleteValuedPropertyEntry,
  type EpObjectEntity,
  type EpTypeEntity,
  type ObjectFilterOptions,
  type SelectPropertySchemeEntry,
  type SelectPropertyValueOptionEntry,
  type SelectValuedPropertyEntry,
} from "@/core/domain/type";
import type { ValuedPropertiesScheme } from "@/core/application/type";

export const useObjectEditorStore = defineStore("object-editor", () => {
  const focusedObjectId = ref<EpObjectId>();
  const focusedObject = ref<EpObjectEntity>();
  const isObjectEidtorOpen = ref<boolean>(false);

  const valuedProperties = ref<ValuedPropertiesScheme>();

  const selectedType = ref<EpTypeEntity>();
  const availableTypes = ref<EpTypeEntity[]>([]);

  const propertyFieldError = ref<Map<EpPropertyId, string | undefined>>(
    new Map(),
  );

  const focusObject = async (id: EpObjectId) => {
    focusedObjectId.value = id;
    focusedObject.value = await globalObjectsService.get(id);
    if (focusedObject.value) {
      valuedProperties.value =
        await globalObjectsService.getValuedObjectProps(id);
      selectedType.value = await globalTypingService.get(
        focusedObject.value.id,
      );
      availableTypes.value = await globalTypingService.getDescendants(
        focusedObject.value.typeId,
      );
    }
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

  const setObjectEditorState = (value: boolean) => {
    isObjectEidtorOpen.value = value;
  };

  const togleObjectEditorState = () => {
    isObjectEidtorOpen.value = !isObjectEidtorOpen.value;
  };
  const getFilteredObjects = async (
    propertyScheme: AutocompleteValuedPropertyEntry,
    searchText: string = "",
  ): Promise<{ id: string; label: string; description?: string }[]> => {
    const filterOptions: ObjectFilterOptions = {
      types: propertyScheme.filterConfig?.allowedTypeIds,
      descendantTypes: propertyScheme.filterConfig?.includeParents,
      limit: 10,
    };

    if (searchText.length > 0) {
      filterOptions.text = searchText;
    } else {
      filterOptions.text = undefined;
    }

    const objects = await globalObjectsService.getAll(filterOptions);

    const objectOptions = objects.map((it) => {
      let title = it.id;

      if (isAnyContainer(it)) {
        console.log(it);
        title = it.content.title;
      }

      return {
        id: it.id,
        label: title as string,
        description: it.objectPath.map((it) => it.title).join(" > "),
      };
    });

    return [...objectOptions];
  };

  return {
    focusedObject,
    valuedProperties,
    isObjectEidtorOpen,

    availableTypes,
    selectedType,

    propertyFieldError,

    getFilteredObjects,
    togleObjectEditorState,
    setObjectEditorState,
    clearPropertyErrorMsg,
    setPropertyErrorMsg,
    clearErrorMsgs,
    focusObject,
    clearFocusObject,
  };
});
