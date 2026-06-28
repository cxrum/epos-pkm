import { ref, toRaw, type Ref } from "vue";
import type { EditorControllerContract } from "./contract";
import type { EpObjectId, EpPropertyId } from "@/core/types"; // Додано EpPropertyId
import type {
  EpContainerObjectEntity,
  EpObjectEntity,
} from "@/core/domain/type";
import { mapObjectEntitiesToContent } from "./helpers";
import type { Emitter } from "mitt";
import type { ApplicationEvents } from "@/bus/application";

export function useBaseEditorController(
  applicationBus: Emitter<ApplicationEvents>,
): EditorControllerContract {
  const focusedObjectId: Ref<EpObjectId | undefined> = ref();
  const initialData: Ref<EpContainerObjectEntity | undefined> = ref();
  const draftData: Ref<EpContainerObjectEntity | undefined> = ref();

  const setObjectId = (id: EpObjectId): void => {
    focusedObjectId.value = id;
  };

  const clearSelection = (): void => {
    focusedObjectId.value = undefined;
  };

  const setInitialData = (obj: EpContainerObjectEntity): void => {
    initialData.value = structuredClone(toRaw(obj));
    draftData.value = structuredClone(toRaw(obj));
  };

  const updateDraftContent = (
    content: EpObjectEntity[],
    order: EpObjectId[],
  ): void => {
    if (!draftData.value) return;

    draftData.value.content.inlineObjects = mapObjectEntitiesToContent(content);
    draftData.value.content.order = order;
  };

  const updateDraftObjectProperty = (
    targetObjectId: EpObjectId,
    propertyId: EpPropertyId,
    newValue: any,
  ): void => {
    if (!draftData.value) return;

    if (draftData.value.id === targetObjectId) {
      if (draftData.value.props[propertyId]) {
        draftData.value.props[propertyId].value = newValue;
      }
    } else {
      const inlineObj = draftData.value.content.inlineObjects[targetObjectId];
      if (inlineObj && inlineObj.props[propertyId]) {
        inlineObj.props[propertyId].value = newValue;
      }
    }

    applicationBus.emit("draft:property-updated", {
      targetObjectId,
      propertyId,
      newValue,
    });
  };

  return {
    focusedObjectId,
    initialData,
    draftData,

    updateDraftContent,
    updateDraftObjectProperty,
    setInitialData,
    setObjectId,
    clearSelection,
  };
}
