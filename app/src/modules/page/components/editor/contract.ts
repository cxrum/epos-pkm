import type { EpContainerObjectEntity } from "@/core/domain/type";
import type { EpObjectId } from "@/core/types";
import type { JSONContent } from "@tiptap/core";
import type { Ref } from "vue";

export interface EditorControllerContract {
  selectedObjectId: Ref<EpObjectId | undefined>;
  initialData: Ref<EpContainerObjectEntity | undefined>;
  draftData: Ref<JSONContent | undefined>;

  updateDraftContent(obj: JSONContent): void;
  setInitialData(obj: EpContainerObjectEntity): void;
  setObjectId(id: EpObjectId): void;
  clearSelection(): void;
}
