import type { ObjectStorageRepositoryContract } from "../domain/repositories/objectRepositoryContract";
import type { TypingRepositoryContract } from "../domain/repositories/typesRepositoryContract";
import type { ObjetServiceContract } from "../store/services/objectsContract";
import type { EpObjectId, ObjectFilterOptions, ObjectPath } from "../types";
import type { EpObject, EpType, ObjectHierarchyNode } from "./types";

export class ObjectsService implements ObjetServiceContract {
  private readonly typingRepository: TypingRepositoryContract;
  private readonly objectsStorageRepository: ObjectStorageRepositoryContract;

  constructor(
    typingRepository: TypingRepositoryContract,
    objectsStorageRepository: ObjectStorageRepositoryContract,
  ) {
    this.typingRepository = typingRepository;
    this.objectsStorageRepository = objectsStorageRepository;
  }
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  get(id: EpObjectId): Promise<EpObject> {
    throw new Error("Method not implemented.");
  }
  getAll(filterOptions: ObjectFilterOptions | undefined): Promise<EpObject[]> {
    throw new Error("Method not implemented.");
  }
  create(object: EpObject): Promise<EpObject> {
    throw new Error("Method not implemented.");
  }
  update(id: EpObjectId, newData: EpObject): Promise<EpObject> {
    throw new Error("Method not implemented.");
  }
  delete(id: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getTree(): Promise<ObjectHierarchyNode> {
    throw new Error("Method not implemented.");
  }
  getObjectPath(id: EpObjectId): Promise<ObjectPath> {
    throw new Error("Method not implemented.");
  }
  getPaths(): Promise<Record<EpObjectId, ObjectPath>> {
    throw new Error("Method not implemented.");
  }
}
