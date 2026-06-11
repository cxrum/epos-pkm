import type { EpTypeEntity } from "@/core/domain/type";
import type { EpTypeId, SystemTypeId } from "@/core/types";

export interface TypingServiceContract {
  getType(id: EpTypeId): Promise<EpTypeEntity | undefined>;
  getAllTypes(): Promise<EpTypeEntity[]>;

  createType(type: EpTypeEntity): Promise<EpTypeEntity>;
  updateType(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: Partial<EpTypeEntity>,
  ): Promise<EpTypeEntity | undefined>;
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
  getDescendants(parentType: EpTypeId): Promise<EpTypeEntity[]>;
}
