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
import { toRaw } from "vue";

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
        await this.objectsStorageRepository.remove(linkToDelete.id);
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

  async existTitle(parentId: EpObjectId, title: string): Promise<boolean> {
    const parent = await this.objectsStorageRepository.get(parentId);

    if (!parent || !isAnyContainer(parent)) {
      return false;
    }

    const links = this.getMountedLinks(parent);

    const childPromises = links.map((link) =>
      this.objectsStorageRepository.get(link.content.toId),
    );

    const children = await Promise.all(childPromises);

    return children.some(
      (childObj) =>
        childObj &&
        isAnyContainer(childObj) &&
        childObj.content.title === title,
    );
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
          kind: "system",
          isChangeable: false,
        },
      },
    };
  }

  private async generateUniqueTitle(
    parentId: EpObjectId,
    baseTitle: string = "Untitled",
  ): Promise<string> {
    let counter = 0;
    let candidateTitle = baseTitle;

    while (await this.existTitle(parentId, candidateTitle)) {
      counter++;
      candidateTitle = `${baseTitle} (${counter})`;
    }

    return candidateTitle;
  }

  async create(
    parentId: EpObjectId | undefined,
    object: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const obj = toRaw(object);
    if (isAnyContainer(obj)) {
      const resultTitle = await this.generateUniqueTitle(
        parentId ?? "-1",
        obj.content.title,
      );
      obj.content.title = resultTitle;
    }

    const res = await this.objectsStorageRepository.create(parentId, obj);
    const parent = await this.objectsStorageRepository.get(parentId ?? "-1"); // TODO: Fix hardcoded workspace ID. Rebase it to current workspace meta.
    if (isAnyContainer(obj) && parent && isAnyContainer(parent)) {
      const _obj = this.createContainerLink(obj.id);
      await this.objectsStorageRepository.create(parentId, _obj);
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

    const resultTitle = await this.generateUniqueTitle(
      parentId ?? "-1",
      "Untitled",
    );

    const initialContent = isContainer
      ? { title: resultTitle, order: [], inlineObjects: {} }
      : {};

    const objectPath = parentId
      ? [
          ...(await this.getObjectAncestors(parentId)),
          newObjectId as EpObjectId,
        ]
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

  async remove(id: EpObjectId): Promise<boolean> {
    const obj = await this.objectsStorageRepository.get(id);

    if (obj && isAnyContainer(obj)) {
      const parentObjId = await this.objectsStorageRepository.getParent(obj.id);

      if (parentObjId) {
        const parentObj = await this.objectsStorageRepository.get(parentObjId);

        if (parentObj && isAnyContainer(parentObj)) {
          const mountedLinks = this.getMountedLinks(parentObj);
          const link = mountedLinks.find((it) => it.content.toId === id);

          if (link) {
            await this.objectsStorageRepository.remove(link.id);
          }
        }
      }
    }

    return await this.objectsStorageRepository.remove(id);
  }
  async getFileTree(): Promise<TreeNode> {
    const result = await this.objectsStorageRepository.getTreeHierarchy();
    const convertor = async (
      rawRoot: ObjectHierarchyNode,
      cache: Map<EpObjectId, TreeNode> = new Map(),
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
        icon: type?.icon,
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

  async getObjectAncestors(id: EpObjectId): Promise<ObjectPath> {
    const res: ObjectPath = [];
    const ancestors = await this.objectsStorageRepository.getAncestors(id);

    for (const ancestor of ancestors) {
      const obj = await this.objectsStorageRepository.get(ancestor);

      if (obj && isAnyContainer(obj)) {
        res.push({
          id: obj.id,
          title: obj.content.title,
        });
      }
    }

    return res;
  }

  async getPaths(): Promise<Record<EpObjectId, ObjectPath>> {
    throw new Error("Method not implemented.");
  }
}
