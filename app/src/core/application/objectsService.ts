import type { TreeNode } from "@/shared/components/tree/contract";
import type { ObjectStorageRepositoryContract } from "../domain/repositories/objectRepositoryContract";
import type { TypingRepositoryContract } from "../domain/repositories/typesRepositoryContract";
import type {
  EpObjectEntity,
  ObjectFilterOptions,
  ObjectHierarchyNode,
} from "../domain/type";
import type { ObjetServiceContract } from "../store/services/objectsContract";
import type { EpObjectId, EpTypeId, ObjectPath } from "../types";

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
  async move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean> {
    return await this.objectsStorageRepository.move(movedId, parentId);
  }
  async get(id: EpObjectId): Promise<EpObjectEntity | undefined> {
    const result = await this.objectsStorageRepository.get(id);
    if (!result) {
      return undefined;
    }
    const type = await this.typingRepository.get(result.typeId);
    if (!type) {
      return undefined;
    }

    return result;
  }
  async getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<EpObjectEntity[]> {
    let expandedTypes: EpTypeId[] | undefined = undefined;
    const descendantsMap = await this.typingRepository.getAllDescendants();

    if (filterOptions && filterOptions.descendantTypes && filterOptions.types) {
      const baseTypes = Array.isArray(filterOptions.types)
        ? filterOptions.types
        : [filterOptions.types];

      const collectedTypes = [...baseTypes];
      for (let i = 0; i < baseTypes.length; i++) {
        const children = descendantsMap.get(baseTypes[i]);
        if (children) {
          for (let j = 0; j < children.length; j++) {
            collectedTypes.push(children[j]);
          }
        }
      }
      expandedTypes = collectedTypes;
    }

    const res = await this.objectsStorageRepository.getAll(
      filterOptions,
      descendantsMap,
    );

    if (!res) {
      return [];
    }

    return res;
  }

  async create(
    parentId: EpObjectId | undefined,
    object: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const res = await this.objectsStorageRepository.create(parentId, object);
    return res;
  }
  async update(
    id: EpObjectId,
    newData: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    return await this.objectsStorageRepository.update(id, newData);
  }
  async delete(id: EpObjectId): Promise<boolean> {
    return await this.objectsStorageRepository.delete(id);
  }
  async getFileTree(): Promise<TreeNode> {
    const result = await this.objectsStorageRepository.getTreeHierarchy();

    const convertor = async (
      rawRoot: ObjectHierarchyNode,
      cache: Map<EpTypeId, TreeNode> = new Map(),
    ): Promise<TreeNode> => {
      if (cache.has(rawRoot.id)) {
        return cache.get(rawRoot.id)!;
      }

      const type = await this.typingRepository.get(rawRoot.typeId);
      const object = await this.objectsStorageRepository.get(rawRoot.id);

      let title = type?.title ?? "unknown";
      if (object && object.typeId === "sys:page") {
        title = object.content.title;
      }

      const newNode: TreeNode = {
        id: rawRoot.id,
        type: type,
        title: title,
        children: [],
      };

      cache.set(newNode.id, newNode);

      if (rawRoot.children && rawRoot.children.length > 0) {
        for (let i = 0; i < rawRoot.children.length; i++) {
          const rawChild = rawRoot.children[i];
          const convertedChild = await convertor(rawChild, cache);
          newNode.children.push(convertedChild);
        }
      }

      return newNode;
    };

    return await convertor(result);
  }
  async getObjectPath(id: EpObjectId): Promise<ObjectPath> {
    return await this.getObjectPath(id);
  }
  async getPaths(): Promise<Record<EpObjectId, ObjectPath>> {
    throw new Error("Method not implemented.");
  }
}
