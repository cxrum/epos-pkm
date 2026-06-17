import type { EpObjectId, EpTypeId, ObjectPath } from "@/core/types";
import type {
  EpObjectEntity,
  ObjectFilterOptions,
  ObjectHierarchyNode,
} from "../type";

export interface ObjectStorageRepositoryContract {
  init(): Promise<void>;
  get(id: EpObjectId): Promise<EpObjectEntity | undefined>;
  create(
    parentId: EpObjectId | undefined,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity>;
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
    descendantTypes: Map<EpTypeId, EpTypeId[]> | undefined,
  ): Promise<EpObjectEntity[]>;
  getTreeHierarchy(): Promise<ObjectHierarchyNode>;
  getAncestors(objId: EpObjectId): EpObjectId[];
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;
}
