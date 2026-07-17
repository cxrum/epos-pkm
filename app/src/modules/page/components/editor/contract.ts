import type {
  EpContainerObjectEntity,
  EpObjectEntity,
} from "@/core/domain/type";
import type { EpObjectId, EpPropertyId } from "@/core/types";
import type { InjectionKey, Ref } from "vue";

export interface EditorControllerContract {
  focusedObjectId: Ref<EpObjectId | undefined>;
  initialData: Ref<EpContainerObjectEntity | undefined>;
  draftData: Ref<EpContainerObjectEntity | undefined>;
  isOpened: Ref<boolean>;
  isFocusLocked: Ref<boolean>;

  setFocusLock(state: boolean): void;
  updateDraftObjectProperty(
    targetObjectId: EpObjectId,
    propertyId: EpPropertyId,
    newValue: any,
  ): void;
  updateDraftContent(content: EpObjectEntity[], order: EpObjectId[]): void;
  setInitialData(obj: EpContainerObjectEntity): void;
  focusObject(id: EpObjectId): void;
  unfocus(): void;
}

export const EditorControllerKey: InjectionKey<EditorControllerContract> =
  Symbol("EditorController");
