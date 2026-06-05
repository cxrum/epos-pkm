import type { EpTypeId, SystemTypeId } from "@/core/types";
import type { EpTypeEntity, TypeHierarchyNode, UserTypeEntity } from "../type";

export interface TypingRepositoryContract {
  get(id: EpTypeId): Promise<EpTypeEntity | undefined>;
  getAll(): Promise<EpTypeEntity[]>;
  create(type: Omit<UserTypeEntity, "kind">): Promise<UserTypeEntity>;
  update(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: UserTypeEntity,
  ): Promise<UserTypeEntity | undefined>;
  remove(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean>;

  inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean>;

  index(): void;
  getTree(): Promise<TypeHierarchyNode>;
  getAncestors(id: EpTypeId): Promise<EpTypeId[]>;
  getDescendants(id: EpTypeId): Promise<EpTypeId[]>;
}
