import type { EpObjectEntity, ObjectFilterOptions } from "@/core/domain/type";
import type { EpObjectId, ObjectPath } from "@/core/types";
import type { TreeNode } from "@/shared/components/tree/contract";

export interface ObjetServiceContract {
  get(id: EpObjectId): Promise<EpObjectEntity | undefined>;
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<EpObjectEntity[]>;
  create(
    parentId: EpObjectId | undefined,
    object: EpObjectEntity,
  ): Promise<EpObjectEntity>;
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;

  getFileTree(): Promise<TreeNode>;
  getObjectPath(id: EpObjectId): Promise<ObjectPath>;
  getPaths(): Promise<Record<EpObjectId, ObjectPath>>;
}
