import type {
  EpObjectEntity,
  ObjectFilterOptions,
  ObjectHierarchyNode,
} from "@/core/domain/type";
import type { EpObjectId, ObjectPath } from "@/core/types";

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

  getTree(): Promise<ObjectHierarchyNode>;
  getObjectPath(id: EpObjectId): Promise<ObjectPath>;
  getPaths(): Promise<Record<EpObjectId, ObjectPath>>;
}
