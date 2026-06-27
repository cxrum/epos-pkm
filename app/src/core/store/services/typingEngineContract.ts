import type { PropertiesScheme } from "@/core/application/type";
import type { BasePropertiesScheme, EpTypeEntity } from "@/core/domain/type";
import type { Edge } from "@/core/infra/utils";
import type { EpTypeId, SystemTypeId } from "@/core/types";
import type { TreeNode } from "@/shared/components/tree/contract";

export interface TypingServiceContract {
  get(id: EpTypeId): Promise<EpTypeEntity | undefined>;
  getAllTypes(): Promise<EpTypeEntity[]>;
  getEdges(): Edge<EpTypeId>[];
  getTree(): Promise<TreeNode>;
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
  getFullPropsScheme(typeId: EpTypeId): Promise<PropertiesScheme>;
  getPropsScheme(typeId: EpTypeId): Promise<PropertiesScheme>;
  getDescendants(parentType: EpTypeId): Promise<EpTypeEntity[]>;
  getAncestors(type: EpTypeId): Promise<EpTypeEntity[]>;
}
