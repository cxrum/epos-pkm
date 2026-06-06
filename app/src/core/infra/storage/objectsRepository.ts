import type { ObjectStorageRepositoryContract } from "@/core/domain/repositories/objectRepositoryContract";
import type { EpObjectEntity, ObjectHierarchyNode } from "@/core/domain/type";
import type { EpObjectId, EpTypeId, ObjectFilterOptions } from "@/core/types";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import type { RawContainerObject } from "./type";
import type { Edge } from "../utils";

export class ObjectStorageRepository implements ObjectStorageRepositoryContract {
  private readonly userStorageApi: FileSystemApi<RawContainerObject>;

  private fileTreeStructure: ObjectHierarchyNode = {
    id: -1,
    typeId: "sys:root",
    children: [],
  };
  private fileTreeCache: Map<EpObjectId, RawContainerObject> = new Map();

  constructor(userStorageApi: FileSystemApi<RawContainerObject>) {
    this.userStorageApi = userStorageApi;
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
      id: -1 as EpObjectId,
      typeId: "sys:root" as EpTypeId,
      children: [],
    };

    for (const [pathKey, node] of nodeMap.entries()) {
      if (!targetsSet.has(pathKey)) {
        resultFileTree.children.push(node);
      }
    }

    return resultFileTree;
  }

  private async loadFileCache(
    flattenData: Record<string, RawContainerObject>,
  ): Promise<Map<EpObjectId, RawContainerObject>> {
    const nodeMap = new Map<EpObjectId, RawContainerObject>();

    for (const [path, rawData] of Object.entries(flattenData)) {
      nodeMap.set(rawData.id, rawData);
    }

    return nodeMap;
  }

  private async index(): Promise<void> {
    const edges = await this.userStorageApi.tree("./");
    const flattenData = await this.userStorageApi.getAllFlat("./");

    this.fileTreeCache = await this.loadFileCache(flattenData);
    this.fileTreeStructure = await this.loadTree(edges, flattenData);
  }

  async get(id: EpObjectId): Promise<EpObjectEntity | undefined> {
    const result = await this.fileTreeCache.get(id);
    if (!result) {
      return undefined;
    }

    return {
      id: result.id,
      typeId: result.typeId,
      content: result.rawData,
      path: "",
    };
  }

  async create(
    parentId: EpObjectId,
    data: EpObjectEntity,
  ): Promise<EpObjectEntity> {
    const parent = await this.get(parentId);
    if (!parent) {
      throw Error();
    }

    if (data.typeId === "sys:page") {
      const container: RawContainerObject = {
        id: data.id,
        typeId: data.typeId,
        title: data.content.title,
        rawData: data.content.inlineObjects,
      };
      this.userStorageApi.save(`${parent.path}/${container.title}`, container);
    } else {
      // HOW TO SAVE OBJECT IN A CONTAINER IN THE CORRECT ORDER AS ON FRONT ? DOES I NEED TO IMPLEMENT  INDEXING ????
    }

    // // TODO: Move hierarchy logic to domain level companion object, call this fun on application level
    // if (parent.typeId === "sys:root") {
    //   if (data.typeId !== "sys:page") {
    //     throw Error();
    //   }
    // }

    // if (parent.typeId === 'sys:page') {

    // }
    await this.index();
    return data;
  }
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity> {
    throw new Error("Method not implemented.");
  }
  delete(id: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<EpObjectEntity[]> {
    throw new Error("Method not implemented.");
  }
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
