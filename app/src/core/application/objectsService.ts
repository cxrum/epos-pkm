import type { TreeNode } from "@/shared/components/tree/contract";
import type { ObjectStorageRepositoryContract } from "../domain/repositories/objectRepositoryContract";
import type { TypingRepositoryContract } from "../domain/repositories/typesRepositoryContract";
import {
  isAnyContainer,
  isMountedContainerEntity,
  isWorkspaceEntity,
  type AllPropertiesMap,
  type EpObjectEntity,
  type MountedContainerObjectEntity,
  type ObjectFilterOptions,
  type ObjectHierarchyNode,
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

  getMountedLinks(parent: EpObjectEntity): MountedContainerObjectEntity[] {
    if (!isAnyContainer(parent)) {
      return [];
    }
    const links: MountedContainerObjectEntity[] = [];
    const objectsMap = parent.content.inlineObjects;

    for (const id of parent.content.order) {
      const child = objectsMap[id];
      if (child && isMountedContainerEntity(child)) {
        links.push(child);
      }
    }

    return links;
  }

  async move(
    movedPageId: EpObjectId,
    newParentId?: EpObjectId,
    oldParentId?: EpObjectId,
  ): Promise<boolean> {
    const targetNewParentId = newParentId ?? ("-1" as EpObjectId);
    const targetOldParentId = oldParentId ?? ("-1" as EpObjectId);

    const newParent =
      await this.objectsStorageRepository.get(targetNewParentId);
    const oldParent =
      await this.objectsStorageRepository.get(targetOldParentId);
    const movedPage = await this.objectsStorageRepository.get(movedPageId);

    if (!newParent || !oldParent || !movedPage) {
      console.error("Move failed: Object or parent not found");
      return false;
    }

    if (
      isAnyContainer(newParent) &&
      isAnyContainer(oldParent) &&
      isAnyContainer(movedPage)
    ) {
      const oldMountedLinks = this.getMountedLinks(oldParent);
      const linkToDelete = oldMountedLinks.find(
        (link) => link.content?.toId === movedPageId,
      );

      if (linkToDelete) {
        await this.objectsStorageRepository.delete(linkToDelete.id);
      }

      const newMountedLinks = this.getMountedLinks(newParent);
      const alreadyExists = newMountedLinks.some(
        (link) => link.content?.toId === movedPageId,
      );

      if (!alreadyExists) {
        const newLinkObj = this.createContainerLink(movedPageId);
        await this.objectsStorageRepository.create(
          targetNewParentId,
          newLinkObj,
        );
      }
    }

    return await this.objectsStorageRepository.move(
      movedPageId,
      targetNewParentId,
    );
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
  async getAll(filterOptions: ObjectFilterOptions): Promise<EpObjectEntity[]> {
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

    const res = await this.objectsStorageRepository.getAll({
      text: filterOptions.text,
      types: expandedTypes,
    });

    if (!res) {
      return [];
    }

    return res;
  }

  private createContainerLink(
    mountedContainerId: EpObjectId,
  ): MountedContainerObjectEntity {
    return {
      id: crypto.randomUUID(),
      typeId: "sys:hard-page-link",
      physicalRelativePath: "",
      objectPath: [],
      content: {
        toId: mountedContainerId,
      },
      props: {
        isContainer: {
          id: "isContainer",
          title: "Is Container",
          type: "boolean",
          value: false,
        },
      },
    };
  }

  async create(
    parentId: EpObjectId | undefined,
    object: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const res = await this.objectsStorageRepository.create(parentId, object);
    const parent = await this.objectsStorageRepository.get(parentId ?? "-1"); // TODO: Fix hardcoded workspace ID. Rebase it to current workspace meta.
    if (isAnyContainer(object) && parent && isAnyContainer(parent)) {
      const obj = this.createContainerLink(object.id);
      await this.objectsStorageRepository.create(parentId, obj);
    }
    return res;
  }

  async createEmpty(
    parentId: EpObjectId | undefined,
    objectType: EpTypeId,
  ): Promise<EpObjectEntity> {
    const type = await this.typingRepository.get(objectType);

    if (!type) {
      throw new Error();
    }

    const typeSchema = await this.typingRepository.getFullPropsScheme(type.id);

    if (!typeSchema) {
      throw new Error();
    }

    const newObjectId = crypto.randomUUID() as EpObjectId;
    const isContainerDefinition = typeSchema.props["isContainer"];
    const isContainer = isContainerDefinition ? true : false;

    const initialProps: Record<string, any> = {};
    const schemaProps = Object.values(typeSchema.props);

    for (let i = 0; i < schemaProps.length; i++) {
      const propDef = schemaProps[i];
      let defaultValue: any = null;

      if (propDef.type === "boolean") defaultValue = false;
      if (propDef.type === "text") defaultValue = "";
      if (propDef.type === "number") defaultValue = 0;
      if (propDef.type === "select") defaultValue = [];

      if (propDef.id === "isContainer") {
        defaultValue = isContainer;
      }

      initialProps[propDef.id] = {
        ...propDef,
        value: defaultValue,
      };
    }

    const initialContent = isContainer
      ? { title: "Untitled", order: [], inlineObjects: {} }
      : {};

    const objectPath = parentId
      ? [...(await this.getObjectPath(parentId)), newObjectId as EpObjectId]
      : ["-1" as EpObjectId, newObjectId as EpObjectId];

    const newObject: EpObjectEntity = {
      id: newObjectId,
      typeId: objectType,
      props: initialProps as AllPropertiesMap,
      content: initialContent,
      physicalRelativePath: "",
      objectPath: objectPath as ObjectPath,
    } as EpObjectEntity;

    const targetParentId = parentId ?? ("-1" as EpObjectId); // TODO: Fix hardcoded workspace ID. Rebase it to current workspace meta.
    const parent = await this.objectsStorageRepository.get(targetParentId);

    const res = await this.objectsStorageRepository.create(
      targetParentId,
      newObject,
    );

    if (isContainer && parent && isAnyContainer(parent)) {
      const obj = this.createContainerLink(res.id);
      await this.objectsStorageRepository.create(targetParentId, obj);
    }

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

      let title = "Unknown";

      if (object && isAnyContainer(object)) {
        title = object.content.title;
      } else if (object && isMountedContainerEntity(object)) {
        title = object.content.toId;
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
    const ancestors = await this.objectsStorageRepository.getAncestors(id);
    return await Promise.all(
      ancestors.map(async (it) => {
        const obj = await this.objectsStorageRepository.get(it);
        return {
          id: it,
          title: obj?.content.title ?? "unknown",
        };
      }),
    );
  }

  async getPaths(): Promise<Record<EpObjectId, ObjectPath>> {
    throw new Error("Method not implemented.");
  }
}
