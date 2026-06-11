import type { EpObjectId, EpTypeId } from "@/core/types";
import type {
  BaseEpObjectEntity,
  EpObjectEntity,
  ObjectFilterOptions,
  ObjectHierarchyNode,
} from "../type";

export interface ObjectStorageRepositoryContract {
  get(id: EpObjectId): Promise<BaseEpObjectEntity | undefined>;
  create(
    parentId: EpObjectId | undefined,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity>;
  update(
    id: EpObjectId,
    newData: BaseEpObjectEntity,
  ): Promise<BaseEpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
    descendantTypes: Map<EpTypeId, EpTypeId[]> | undefined,
  ): Promise<BaseEpObjectEntity[]>;
  getTreeHierarchy(): Promise<ObjectHierarchyNode>;
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;
}
