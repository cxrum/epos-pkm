import type { EpContainerObjectEntity } from "@/core/domain/type";
import type { EpObjectId } from "@/core/types";
import type { Ref } from "vue";

export interface EditorControllerContract {
  selectedObjectId: Ref<EpObjectId | undefined>;
  initialData: Ref<EpContainerObjectEntity | undefined>;
  draftData: Ref<any | undefined>;

  updateDraftContent(obj: any): void;
  setInitialData(obj: EpContainerObjectEntity): void;
  setObjectId(id: EpObjectId): void;
  clearSelection(): void;
}
