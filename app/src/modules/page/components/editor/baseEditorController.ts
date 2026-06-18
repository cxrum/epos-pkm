import { ref, type Ref } from "vue";
import type { EditorControllerContract } from "./contract";
import type { EpObjectId } from "@/core/types";

export function useBaseEditorController(): EditorControllerContract {
  const selectedObjectId: Ref<EpObjectId | undefined> = ref();

  const setObjectId = (id: EpObjectId): void => {
    selectedObjectId.value = id;
  };
  const clearSelection = (): void => {
    selectedObjectId.value = undefined;
  };

  return { selectedObjectId, setObjectId, clearSelection };
}
