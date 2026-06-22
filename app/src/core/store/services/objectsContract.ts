import type { EpObjectEntity, ObjectFilterOptions } from "@/core/domain/type";
import type { EpObjectId, EpTypeId, ObjectPath } from "@/core/types";
import type { TreeNode } from "@/shared/components/tree/contract";

export interface ObjetServiceContract {
  get(id: EpObjectId): Promise<EpObjectEntity | undefined>;
  getAll(filterOptions: ObjectFilterOptions): Promise<EpObjectEntity[]>;
  create(
    parentId: EpObjectId | undefined,
    object: EpObjectEntity,
  ): Promise<EpObjectEntity>;
  createEmpty(
    parentId: EpObjectId | undefined,
    objectType: EpTypeId,
  ): Promise<EpObjectEntity>;
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  move(
    movedId: EpObjectId,
    newParentId: EpObjectId,
    oldParentId: EpObjectId,
  ): Promise<boolean>;
  getFileTree(): Promise<TreeNode>;
  getObjectAncestors(id: EpObjectId): Promise<ObjectPath>;
  getPaths(): Promise<Record<EpObjectId, ObjectPath>>;
}
