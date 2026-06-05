import type { EpType } from "@/core/application/types";
import type { EpTypeId, SystemTypeId } from "@/core/types";

export interface TypingServiceContract {
  getType(id: EpTypeId): Promise<EpType | undefined>;
  getAllTypes(): Promise<EpType[]>;

  createType(type: EpType): Promise<EpType>;
  updateType(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: Partial<EpType>,
  ): Promise<EpType | undefined>;
  deleteType(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean>;

  inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean>;
  removeInheritance(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<void>;
  isInheritable(parentId: EpTypeId, childId: EpTypeId): Promise<boolean>;
  checkCompatibility(
    parentType: EpTypeId,
    childType: EpTypeId,
  ): Promise<boolean>;
  getDescendants(parentType: EpTypeId): Promise<EpType[]>;
}
