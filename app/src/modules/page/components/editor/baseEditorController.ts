import { ref, type Ref } from "vue";
import type { EditorControllerContract } from "./contract";
import type { EpObjectId } from "@/core/types";
import type { EpContainerObjectEntity } from "@/core/domain/type";
import type { JSONContent } from "@tiptap/core";

export function useBaseEditorController(): EditorControllerContract {
  const focusedObjectId: Ref<EpObjectId | undefined> = ref();
  const initialData: Ref<EpContainerObjectEntity | undefined> = ref();
  const draftData: Ref<JSONContent | undefined> = ref();

  const setObjectId = (id: EpObjectId): void => {
    focusedObjectId.value = id;
  };
  const clearSelection = (): void => {
    focusedObjectId.value = undefined;
  };

  const setInitialData = (obj: EpContainerObjectEntity): void => {
    initialData.value = obj;
  };

  const updateDraftContent = (obj: JSONContent): void => {
    draftData.value = obj;
  };

  return {
    focusedObjectId,
    initialData,
    draftData,

    updateDraftContent,
    setInitialData,
    setObjectId,
    clearSelection,
  };
}
