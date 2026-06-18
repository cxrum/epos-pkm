import type { EpObjectId, EpTypeId, ObjectPath } from "@/core/types";
import type { EpObjectEntity, ObjectHierarchyNode } from "../type";
import type { RawObjectFilterOptions } from "@/core/infra/storage/type";

export interface ObjectStorageRepositoryContract {
  init(): Promise<void>;
  get(id: EpObjectId): Promise<EpObjectEntity | undefined>;
  create(
    parentId: EpObjectId | undefined,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity>;
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  getAll(filterOptions: RawObjectFilterOptions): Promise<EpObjectEntity[]>;
  getTreeHierarchy(): Promise<ObjectHierarchyNode>;
  getAncestors(objId: EpObjectId): EpObjectId[];
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;
}
