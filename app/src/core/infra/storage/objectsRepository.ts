import type { ObjectStorageRepositoryContract } from "@/core/domain/repositories/objectRepositoryContract";
import type {
  AllPropertiesMap,
  EpObjectEntity,
  ObjectHierarchyNode,
} from "@/core/domain/type";
import type { EpObjectId, EpTypeId, ObjectPath, Path } from "@/core/types";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import {
  type AllRawEpObject,
  type RawObjectFilterOptions,
  type RawContainerObject,
  type RawPropertiesSchemeEntry,
  isRawContainer,
} from "./type";
import { type Edge } from "../utils";
import type { an } from "vue-router/dist/router-CWoNjPRp.mjs";

export class ObjectStorageRepository implements ObjectStorageRepositoryContract {
  private readonly userStorageApi: FileSystemApi<RawContainerObject>;

  private readonly ROOT_ID: EpObjectId = "-1";

  private fileTreeStructure: ObjectHierarchyNode = {
    id: this.ROOT_ID,
    typeId: "sys:root",
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
      title: "workspace",
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

    const root = await this.userStorageApi.get("./test-workspace.json");
    if (!root) {
      await this.userStorageApi.save("./test-workspace.json", workspaceRoot);
    }

    await this.index();
  }

  private async loadTree(
    edges: Edge<string>[],
    flattenData: Record<string, RawContainerObject>,
  ): Promise<ObjectHierarchyNode> {
    const nodeMap = new Map<string, ObjectHierarchyNode>();
    const targetsSet = new Set<string>();

    for (const [pathKey, rawData] of Object.entries(flattenData)) {
      nodeMap.set(pathKey, {
        id: rawData.id as EpObjectId,
        typeId: rawData.typeId as EpTypeId,
        children: [],
      });
    }

    for (let i = 0; i < edges.length; i++) {
      const el = edges[i];
      if (el) {
        const parentNode = nodeMap.get(el.source);
        const childNode = nodeMap.get(el.target);

        if (parentNode && childNode) {
          parentNode.children.push(childNode);
          targetsSet.add(el.target);
        }
      }
    }

    const resultFileTree: ObjectHierarchyNode = {
      id: this.ROOT_ID,
      typeId: "sys:workspace" as EpTypeId,
      children: [],
    };

    for (const [pathKey, node] of nodeMap.entries()) {
      if (!targetsSet.has(pathKey)) {
        if (node.id === this.ROOT_ID) continue;
        resultFileTree.children.push(node);
      }
    }

    return resultFileTree;
  }

  private async loadFileCache(
    flattenData: Record<string, RawContainerObject>,
  ): Promise<Map<EpObjectId, AllRawEpObject>> {
    const nodeMap = new Map<EpObjectId, AllRawEpObject>();

    for (const rawContainer of Object.values(flattenData)) {
      nodeMap.set(rawContainer.id, rawContainer);
      for (const rawObject of Object.values(rawContainer.content)) {
        nodeMap.set(rawObject.id, rawObject);
      }
    }

    return nodeMap;
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
    const edges = await this.userStorageApi.tree("");
    const flattenData = await this.userStorageApi.getAllFlat("");

    this.objectPathCache.clear();
    for (const [filePath, container] of Object.entries(flattenData)) {
      this.objectPathCache.set(container.id, filePath);
      for (const childId of Object.keys(container.content || {})) {
        this.objectPathCache.set(childId, filePath);
      }
    }

    this.fileTreeCache = await this.loadFileCache(flattenData);
    this.fileTreeStructure = await this.loadTree(edges, flattenData);
    this.objectTreeEdges = edges;
  }

  private getAncestorPath(id: EpObjectId): ObjectPath {
    const ancestorsPath = this.getAncestors(id).map((it): Path => {
      const res = this.fileTreeCache.get(it);
      if (res !== undefined) {
        return {
          id: res.id,
          title: res?.content?.title,
        };
      } else {
        return {
          id: "unknown",
          title: "unknown",
        };
      }
    });
    return ancestorsPath;
  }

  async get(id: EpObjectId): Promise<EpObjectEntity | undefined> {
    const result = this.fileTreeCache.get(id);

    if (!result) {
      return undefined;
    }

    if (isRawContainer(result)) {
      return {
        id: result.id,
        typeId: result.typeId,
        props: result.properties as AllPropertiesMap,
        content: {
          title: result.title,
          order: result.order,
          inlineObjects: result.content,
        },
        physicalRelativePath: this.objectPathCache.get(result.id) ?? "unknown",
        objectPath: this.getAncestorPath(id),
      };
    }

    return {
      id: result.id,
      typeId: result.typeId,
      props: result.properties as AllPropertiesMap,
      content: result.content,
      physicalRelativePath: this.objectPathCache.get(result.id) ?? "unknown",
      objectPath: this.getAncestorPath(id),
    };
  }

  async create(
    parentId: EpObjectId | undefined,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const parent = await this.get(parentId ?? this.ROOT_ID);
    //console.log("CREATE:parent--\n", parent);
    let isSaved = false;
    if (!parent) {
      throw Error(`Parent with id ${parentId} not found`);
    }

    if (data.props.isContainer.value) {
      const container: RawContainerObject = {
        id: data.id,
        typeId: data.typeId,
        title: data.content.title,
        properties: data.props,
        order: [],
        content: data.content.inlineObjects || {},
      };
      const parentContainerPath = parent.physicalRelativePath.replace(
        ".json",
        "",
      );
      //console.log(parentContainerPath);
      await this.userStorageApi.save(
        `${parentContainerPath}/${container.title}.json`,
        container,
      );
      isSaved = true;
    } else if (parent.props.isContainer.value) {
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
    return data;
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

    if (newData.props.isContainer.value) {
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
    } else {
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
    filterOptions: RawObjectFilterOptions | undefined,
    descendantTypes: Map<EpTypeId, EpTypeId[]> | undefined, // FIXME: Smell code, remove this argument. A) Implement application level sort (very slow in action but fast solution) B) Inject typingRepo into this repo (smell code, but efficient)
  ): Promise<EpObjectEntity[]> {
    const results: EpObjectEntity[] = [];

    const allowedTypes = filterOptions?.types
      ? Array.isArray(filterOptions.types)
        ? filterOptions.types
        : [filterOptions.types]
      : null;

    const searchText = filterOptions?.text?.toLowerCase();

    for (const [id, rawObj] of this.fileTreeCache.entries()) {
      if (
        allowedTypes &&
        descendantTypes &&
        filterOptions?.descendantTypes === true
      ) {
        let isFit = false;
        if (!allowedTypes.includes(rawObj.id)) {
          const types = descendantTypes.get(rawObj.typeId) ?? [];
          for (const typeId of types) {
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
      });
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
      const lastSlashIndex = newParentFilePath.lastIndexOf("/");
      const newDirPath =
        lastSlashIndex !== -1
          ? newParentFilePath.substring(0, lastSlashIndex)
          : "";

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
