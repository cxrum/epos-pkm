import type { EpObjectId } from "@/core/types";
import type { Ref } from "vue";

export interface EditorControllerContract {
  selectedObjectId: Ref<EpObjectId | undefined>;

  setObjectId(id: EpObjectId): void;
  clearSelection(): void;
}
