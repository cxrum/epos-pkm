import type { ObjectStorageRepositoryContract } from "@/core/domain/repositories/objectRepositoryContract";
import {
  isAnyContainer,
  isAnyInlineEntity,
  isMountedPage,
  type AllPropertiesMap,
  type EpContainerObjectEntity,
  type EpInlineObjectEntity,
  type EpObjectEntity,
  type ObjectHierarchyNode,
} from "@/core/domain/type";
import type { EpObjectId, EpTypeId, ObjectPath } from "@/core/types";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import {
  type AllRawEpObject,
  type RawObjectFilterOptions,
  type RawContainerObject,
  isRawContainer,
  type RawEpObject,
  isRawMountedContainer,
} from "./type";
import { type Edge } from "../utils";

export class ObjectStorageRepository implements ObjectStorageRepositoryContract {
  private readonly userStorageApi: FileSystemApi<RawContainerObject>;

  private readonly ROOT_ID: EpObjectId = "-1";

  private fileTreeStructure: ObjectHierarchyNode = {
    id: this.ROOT_ID,
    typeId: "sys:workspace",
    children: [],
  };
  private fileTreeCache: Map<EpObjectId, AllRawEpObject> = new Map();
  private objectPathCache: Map<EpObjectId, string> = new Map();
  private objectTreeEdges: Edge<EpObjectId>[] = [];

  constructor(userStorageApi: FileSystemApi<RawContainerObject>) {
    this.userStorageApi = userStorageApi;
  }

  async init(): Promise<void> {
    const workspaceRoot = {
      id: this.ROOT_ID,
      typeId: "sys:workspace",
      title: "root",
      content: {},
      order: [],
      properties: {
        isContainer: {
          id: "isContainer",
          title: "isContainer",
          type: "boolean",
          value: true,
        },
      },
    } as RawContainerObject;

    const root = await this.userStorageApi.get("./root.json");
    if (!root) {
      await this.userStorageApi.save("./root.json", workspaceRoot);
    }

    await this.index();
  }

  private async loadTree(
    flattenContainers: Record<string, RawContainerObject>,
  ): Promise<ObjectHierarchyNode> {
    const nodeMap = new Map<EpObjectId, ObjectHierarchyNode>();

    for (const rawData of Object.values(flattenContainers)) {
      nodeMap.set(rawData.id, {
        id: rawData.id as EpObjectId,
        typeId: rawData.typeId as EpTypeId,
        children: [],
      });
    }

    for (const rawData of Object.values(flattenContainers)) {
      const parentNode = nodeMap.get(rawData.id);

      if (!parentNode || !rawData.order) continue;

      for (const childId of rawData.order) {
        const childRaw = rawData.content[childId];

        if (childRaw && childRaw.typeId === "sys:hard-page-link") {
          const targetId = childRaw.content.toId;

          if (targetId) {
            const childNode = nodeMap.get(targetId);

            if (childNode) {
              parentNode.children.push(childNode);
            }
          }
        }
      }
    }

    const rootNode = nodeMap.get(this.ROOT_ID);

    if (!rootNode) {
      throw new Error();
    }

    return rootNode;
  }

  private async loadFileCache(
    flattenData: Record<string, RawContainerObject>,
  ): Promise<Map<EpObjectId, AllRawEpObject>> {
    const nodeMap = new Map<EpObjectId, AllRawEpObject>();

    for (const rawContainer of Object.values(flattenData)) {
      nodeMap.set(rawContainer.id, rawContainer);
      for (const rawObject of Object.values(rawContainer.content)) {
        if (!nodeMap.has(rawObject.id)) {
          nodeMap.set(rawObject.id, rawObject);
        }
      }
    }

    return nodeMap;
  }

  private buildObjectEdges(
    flattenData: Record<string, RawContainerObject>,
  ): Edge<EpObjectId>[] {
    const edges: Edge<EpObjectId>[] = [];
    const seenEdges = new Set<string>();

    for (const rawContainer of Object.values(flattenData)) {
      const childIds = rawContainer.order?.length
        ? rawContainer.order
        : Object.keys(rawContainer.content || {});

      for (const childId of childIds) {
        const edgeKey = `${rawContainer.id}->${childId}`;

        if (seenEdges.has(edgeKey)) {
          continue;
        }

        seenEdges.add(edgeKey);
        edges.push({
          source: rawContainer.id,
          target: childId as EpObjectId,
        });

        const child = rawContainer.content[childId];
        if (child && isRawMountedContainer(child)) {
          edges.push({
            source: rawContainer.id,
            target: child.content.toId,
          });
        }
      }
    }

    return edges;
  }

  getAncestors(id: EpTypeId): EpTypeId[] {
    const result: EpTypeId[] = [];
    let currentId = id;

    while (true) {
      const edge = this.objectTreeEdges.find((e) => e.target === currentId);
      if (!edge) break;

      result.push(edge.source);
      currentId = edge.source;
    }
    return result.reverse();
  }

  getDescendants(id: EpTypeId): EpTypeId[] {
    return this.objectTreeEdges
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target);
  }

  private async index(): Promise<void> {
    const flattenData = await this.userStorageApi.getAllFlat("");
    console.log(flattenData);

    this.objectPathCache.clear();
    for (const [filePath, container] of Object.entries(flattenData)) {
      this.objectPathCache.set(container.id, filePath);
      for (const childId of Object.keys(container.content || {})) {
        this.objectPathCache.set(childId, filePath);
      }
    }

    this.fileTreeCache = await this.loadFileCache(flattenData);
    this.fileTreeStructure = await this.loadTree(flattenData);
    this.objectTreeEdges = this.buildObjectEdges(flattenData);
    console.log(this.objectTreeEdges);
  }

  private getAncestorPath(id: EpObjectId): ObjectPath {
    const ancestors = this.getAncestors(id);
    const res: ObjectPath = [];

    for (const id of ancestors) {
      const item = this.fileTreeCache.get(id);

      if (item) {
        if (isRawContainer(item)) {
          res.push({
            id: item.id,
            title: item.title,
          });
        } else {
          res.push({
            id: item.id,
            title: "Unknown",
          });
        }
      }
    }

    return res;
  }

  private inlineToDomain(raw: RawEpObject): EpInlineObjectEntity {
    const ancestors = this.getAncestorPath(raw.id);
    return {
      id: raw.id,
      typeId: raw.typeId,
      props: raw.properties as AllPropertiesMap,
      content: raw.content,
      physicalRelativePath: this.objectPathCache.get(raw.id) ?? "unknown",
      objectPath: ancestors,
    } as EpInlineObjectEntity;
  }

  private batchInlineToDomain(
    rawContent: Record<string, RawEpObject>,
  ): Record<string, EpInlineObjectEntity> {
    const result: Record<string, EpInlineObjectEntity> = {};

    for (const [id, rawItem] of Object.entries(rawContent)) {
      result[id] = this.inlineToDomain(rawItem);
    }

    return result;
  }

  private containerToDomain(raw: RawContainerObject): EpContainerObjectEntity {
    const inline = this.batchInlineToDomain(raw.content);

    const res: EpContainerObjectEntity = {
      id: raw.id,
      typeId: raw.typeId as EpTypeId,
      props: raw.properties as AllPropertiesMap,
      content: {
        title: raw.title,
        order: raw.order,
        inlineObjects: inline,
      },
      physicalRelativePath: this.objectPathCache.get(raw.id) ?? "unknown",
      objectPath: this.getAncestorPath(raw.id),
    } as EpContainerObjectEntity;

    return res;
  }

  async get(id: EpObjectId): Promise<EpObjectEntity | undefined> {
    const result = this.fileTreeCache.get(id);

    if (!result) {
      return undefined;
    }

    if (isRawContainer(result)) {
      return this.containerToDomain(result) as EpObjectEntity;
    }

    return this.inlineToDomain(result) as EpObjectEntity;
  }

  async rename(id: EpObjectId, newTitle: string): Promise<boolean> {
    const result = this.fileTreeCache.get(id);
    if (!result) {
      return false;
    }
    const path = this.objectPathCache.get(result.id);
    if (!path) {
      return false;
    }

    return false;
  }

  async create(
    parentId: EpObjectId | undefined,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const parent = await this.get(parentId ?? this.ROOT_ID);
    let relativePath = "";
    let isSaved = false;
    if (!parent) {
      throw Error(`Parent with id ${parentId} not found`);
    }

    if (isAnyContainer(data)) {
      const container: RawContainerObject = {
        id: data.id,
        typeId: data.typeId,
        title: data.content.title,
        properties: data.props,
        order: data.content.order || [],
        content: data.content.inlineObjects || {},
      };
      const parentContainerPath = parent.physicalRelativePath.replace(
        ".json",
        "",
      );
      relativePath = `${parentContainerPath}/${container.title}.json`;

      await this.userStorageApi.save(relativePath, container);

      isSaved = true;
    } else if (isAnyContainer(parent)) {
      const parentFilePath = parent.physicalRelativePath;
      const parentContainer = await this.userStorageApi.get(parentFilePath);

      if (!parentContainer) {
        throw Error(`Cannot read container data for ${parentId}`);
      }

      if (!parentContainer.order) parentContainer.order = [];
      if (!parentContainer.content) parentContainer.content = {};

      parentContainer.content[data.id] = {
        id: data.id,
        typeId: data.typeId,
        properties: data.props,
        content: data.content,
      };

      if (!parentContainer.order.includes(data.id)) {
        parentContainer.order.push(data.id);
      }

      await this.userStorageApi.save(parentFilePath, parentContainer);
      isSaved = true;
    }

    if (isSaved) {
      await this.index();
    }

    return { ...data, physicalRelativePath: relativePath };
  }

  async update(
    id: EpObjectId,
    newData: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const filePath = this.objectPathCache.get(id);

    if (!filePath) {
      throw new Error(`Path for object ${id} not found in cache`);
    }

    const container = await this.userStorageApi.get(filePath);

    if (!container) {
      throw new Error(`File not found at ${filePath}`);
    }

    let isSaved = false;

    if (isAnyContainer(newData)) {
      const oldTitle = container.title;
      container.title = newData.content.title;
      container.properties = newData.props;
      container.order = newData.content.order;
      const cleanInlineObjects: Record<string, any> = {};
      const sourceInlines: Record<string, any> =
        newData.content.inlineObjects || {};

      for (const [inlineId, inlineObj] of Object.entries(sourceInlines)) {
        cleanInlineObjects[inlineId] = {
          id: inlineObj.id,
          typeId: inlineObj.typeId,
          properties: { ...(inlineObj.props || inlineObj.properties) },
          content: { ...inlineObj.content },
        };

        if (cleanInlineObjects[inlineId].content.inlineObjects) {
          delete cleanInlineObjects[inlineId].content.inlineObjects;
        }
      }

      container.content = cleanInlineObjects;

      if (oldTitle !== newData.content.title) {
        const lastSlashIndex = filePath.lastIndexOf("/");
        const dirPath =
          lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex) : "";
        const newFilePath = dirPath
          ? `${dirPath}/${newData.content.title}.json`
          : `${newData.content.title}.json`;

        await this.userStorageApi.rename(filePath, newFilePath);
        await this.userStorageApi.save(newFilePath, container);
      } else {
        await this.userStorageApi.save(filePath, container);
      }
      isSaved = true;
    } else if (isAnyInlineEntity(newData) && !isMountedPage(newData)) {
      if (!container.content[id]) {
        throw new Error(`Inline object ${id} not found in ${filePath}`);
      }

      const cleanContent = { ...newData.content };

      if (cleanContent.inlineObjects) {
        delete cleanContent.inlineObjects;
      }

      container.content[id] = {
        id: newData.id,
        typeId: newData.typeId,
        properties: { ...newData.props },
        content: cleanContent,
      };

      await this.userStorageApi.save(filePath, container);
      isSaved = true;
    }

    if (isSaved) {
      await this.index();
    }

    return newData;
  }

  async delete(id: EpObjectId): Promise<boolean> {
    const filePath = this.objectPathCache.get(id);

    if (!filePath) {
      return false;
    }

    const container = await this.userStorageApi.get(filePath);

    if (!container) {
      return false;
    }

    let isDeleted = false;

    if (container.id === id) {
      await this.userStorageApi.remove(filePath);
      isDeleted = true;
    } else {
      if (container.content && container.content[id]) {
        delete container.content[id];

        if (container.order) {
          container.order = container.order.filter((itemId) => itemId !== id);
        }

        await this.userStorageApi.save(filePath, container);
        isDeleted = true;
      }
    }

    if (isDeleted) {
      await this.index();
    }

    return isDeleted;
  }

  async getAll(
    filterOptions: RawObjectFilterOptions,
  ): Promise<EpObjectEntity[]> {
    const results: EpObjectEntity[] = [];

    const allowedTypes = filterOptions?.types
      ? Array.isArray(filterOptions.types)
        ? filterOptions.types
        : [filterOptions.types]
      : null;

    const searchText = filterOptions?.text?.toLowerCase();

    for (const [id, rawObj] of this.fileTreeCache.entries()) {
      if (allowedTypes) {
        let isFit = false;
        if (!allowedTypes.includes(rawObj.id)) {
          for (const typeId of allowedTypes) {
            if (rawObj.typeId === typeId) {
              isFit = true;
              break;
            }
          }
        } else {
          isFit = true;
        }

        if (!isFit) {
          continue;
        }
      }

      if (searchText) {
        const title = rawObj.content?.title;
        if (
          typeof title === "string" &&
          !title.toLowerCase().includes(searchText)
        ) {
          continue;
        }
      }

      results.push({
        id: rawObj.id,
        typeId: rawObj.typeId,
        props: rawObj.properties as AllPropertiesMap,
        content: rawObj.content,
        physicalRelativePath: this.objectPathCache.get(rawObj.id) || "",
        objectPath: this.getAncestorPath(id),
      } as EpObjectEntity);
    }

    return results;
  }

  async move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean> {
    const oldFilePath = this.objectPathCache.get(movedId);
    const newParentFilePath = this.objectPathCache.get(parentId);

    if (!oldFilePath || !newParentFilePath) {
      return false;
    }

    const movedObj = this.fileTreeCache.get(movedId);
    if (!movedObj) return false;

    let isMoved = false;

    if (movedObj.properties?.isContainer?.value) {
      const newDirPath = newParentFilePath.replace(".json", "");

      const oldFileName = oldFilePath.split("/").pop() || "";
      const newFilePath = newDirPath
        ? `${newDirPath}/${oldFileName}`
        : oldFileName;

      if (oldFilePath !== newFilePath) {
        await this.userStorageApi.move(oldFilePath, newFilePath);

        const oldFolderPath = oldFilePath.replace(".json", "");
        const newFolderPath = newFilePath.replace(".json", "");
        if (await this.userStorageApi.exists(oldFolderPath)) {
          await this.userStorageApi.move(oldFolderPath, newFolderPath);
        }
        isMoved = true;
      }
    } else {
      if (oldFilePath === newParentFilePath) {
        return true;
      }

      const oldContainer = await this.userStorageApi.get(oldFilePath);
      const newContainer = await this.userStorageApi.get(newParentFilePath);

      if (oldContainer && newContainer && oldContainer.content[movedId]) {
        const objData = oldContainer.content[movedId];
        delete oldContainer.content[movedId];

        if (oldContainer.order) {
          oldContainer.order = oldContainer.order.filter(
            (id) => id !== movedId,
          );
        }

        if (!newContainer.content) newContainer.content = {};
        if (!newContainer.order) newContainer.order = [];

        newContainer.content[movedId] = objData;
        newContainer.order.push(movedId);

        await this.userStorageApi.save(oldFilePath, oldContainer);
        await this.userStorageApi.save(newParentFilePath, newContainer);
        isMoved = true;
      }
    }

    if (isMoved) {
      await this.index();
    }

    return isMoved;
  }

  async getTreeHierarchy(): Promise<ObjectHierarchyNode> {
    return this.fileTreeStructure;
  }
}
