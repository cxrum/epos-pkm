import type { EpObject, ObjectHierarchyNode } from "@/core/application/types";
import type { EpObjectId, ObjectFilterOptions, ObjectPath } from "@/core/types";

export interface ObjetServiceContract {
  get(id: EpObjectId): Promise<EpObject>;
  getAll(filterOptions: ObjectFilterOptions | undefined): Promise<EpObject[]>;
  create(object: EpObject): Promise<EpObject>;
  update(id: EpObjectId, newData: EpObject): Promise<EpObject>;
  delete(id: EpObjectId): Promise<boolean>;
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;

  getTree(): Promise<ObjectHierarchyNode>;
  getObjectPath(id: EpObjectId): Promise<ObjectPath>;
  getPaths(): Promise<Record<EpObjectId, ObjectPath>>;
}
