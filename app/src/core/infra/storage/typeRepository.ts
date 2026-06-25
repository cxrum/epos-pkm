import type { TypingRepositoryContract } from "@/core/domain/repositories/typesRepositoryContract";
import type {
  EpTypeEntity,
  UserTypeEntity,
  TypeHierarchyNode,
  _TypeKind,
  BasePropertiesScheme,
} from "@/core/domain/type";
import type { DefaultTypeId, EpTypeId, SystemTypeId } from "@/core/types";
import { deepTraversal, extractTreeEdges, type Edge } from "../utils";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import type { RawEptTypeHierarchyNode, RawEpType } from "./type";

export class TypingRepository implements TypingRepositoryContract {
  private readonly typesStorageApi: FileSystemApi<RawEptTypeHierarchyNode>;
  private readonly MAIN_TYPES_OBJECT_PATH = "./types.json";

  private typeTree: RawEptTypeHierarchyNode;

  private flattenTree: Map<string, RawEpType> = new Map(); // FIXME
  private typeTreeEdges: Edge<EpTypeId>[] = [];
  private descendants: Map<string, EpTypeId[]> = new Map(); // FIXME

  constructor(
    userStorageApi: FileSystemApi<RawEptTypeHierarchyNode>,
    root: RawEptTypeHierarchyNode,
  ) {
    this.typesStorageApi = userStorageApi;
    this.typeTree = root;
  }

  getEdges(): Edge<EpTypeId>[] {
    return this.typeTreeEdges;
  }

  async init(): Promise<void> {
    await this.index();
  }

  private async loadTree(): Promise<RawEptTypeHierarchyNode> {
    const rawTree = await this.typesStorageApi.get(this.MAIN_TYPES_OBJECT_PATH);
    if (!rawTree) {
      await this.typesStorageApi.save(
        this.MAIN_TYPES_OBJECT_PATH,
        this.typeTree,
      );
      return this.typeTree;
    }

    return rawTree;
  }

  private convertRawTypeToEntity(rawType: RawEpType): EpTypeEntity {
    const res: EpTypeEntity = {
      id: rawType.id,
      kind: rawType.kind,
      title: rawType.title,
      icon: rawType.icon,
      propertiesScheme: rawType.propertiesScheme as BasePropertiesScheme,
    } as EpTypeEntity;

    return res;
  }

  private convertTypeHierarchy(
    rawRoot: RawEptTypeHierarchyNode,
    cache: Map<EpTypeId, TypeHierarchyNode> = new Map(),
  ): TypeHierarchyNode {
    if (cache.has(rawRoot.id)) {
      return cache.get(rawRoot.id)!;
    }

    const newNode: TypeHierarchyNode = {
      id: rawRoot.id,
      type: this.convertRawTypeToEntity(rawRoot.type),
      children: [],
    };

    cache.set(newNode.id, newNode);

    if (rawRoot.children && rawRoot.children.length > 0) {
      for (let i = 0; i < rawRoot.children.length; i++) {
        const rawChild = rawRoot.children[i];
        const convertedChild = this.convertTypeHierarchy(rawChild, cache);
        newNode.children.push(convertedChild);
      }
    }

    return newNode;
  }

  private flatten(root: RawEptTypeHierarchyNode): Map<EpTypeId, RawEpType> {
    const cache: Map<EpTypeId, RawEpType> = new Map();

    const traverse = (
      currentNodes: RawEptTypeHierarchyNode[],
      cache: Map<EpTypeId, RawEpType>,
    ) => {
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        const children = node.children;

        if (!cache.has(node.id)) {
          cache.set(node.id, node.type);
        }

        if (children && Array.isArray(children) && children.length > 0) {
          traverse(children, cache);
        }
      }
    };

    traverse([root], cache);

    return cache;
  }

  getAncestors(id: EpTypeId): EpTypeId[] {
    const result: EpTypeId[] = [];
    let currentId = id;

    while (true) {
      const edge = this.typeTreeEdges.find((e) => e.target === currentId);
      if (!edge) break;

      result.push(edge.source);
      currentId = edge.source;
    }

    return result.reverse();
  }

  getDescendants(id: EpTypeId): EpTypeId[] {
    return this.typeTreeEdges
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target);
  }

  getAllDescendants(): Map<EpTypeId, EpTypeId[]> {
    return this.descendants;
  }

  async index(): Promise<void> {
    const rawTree = await this.loadTree();
    const rawTreeEdges = extractTreeEdges<RawEptTypeHierarchyNode, EpTypeId>(
      rawTree,
      "id",
      "children",
    );

    const rawDescendants = deepTraversal<RawEptTypeHierarchyNode, EpTypeId>(
      rawTree,
      "id",
      "children",
    );

    for (const [id, value] of Object.entries(rawDescendants)) {
      this.descendants.set(id, value);
    }

    this.flattenTree = this.flatten(rawTree);
    this.typeTreeEdges = rawTreeEdges;
    this.typeTree = rawTree;
  }

  private async saveState(): Promise<void> {
    this.typesStorageApi.save(this.MAIN_TYPES_OBJECT_PATH, this.typeTree);
    await this.index();
  }

  async get(id: EpTypeId): Promise<EpTypeEntity | undefined> {
    const result = this.flattenTree.get(id);
    if (!result) {
      return undefined;
    }
    return this.convertRawTypeToEntity(result);
  }

  async getAll(): Promise<EpTypeEntity[]> {
    return Array.from(this.flattenTree.values()).map((it) =>
      this.convertRawTypeToEntity(it),
    );
  }

  private rebuildTreeFromFlatState(): RawEptTypeHierarchyNode {
    const nodeMap = new Map<string, RawEptTypeHierarchyNode>();

    for (const [id, typeData] of this.flattenTree.entries()) {
      nodeMap.set(id, {
        id: id,
        type: typeData,
        children: [],
      });
    }

    let rootNode: RawEptTypeHierarchyNode | undefined;

    for (const edge of this.typeTreeEdges) {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);

      if (parent && child) {
        parent.children!.push(child);
      }
    }

    rootNode = nodeMap.get("sys:root");

    if (!rootNode) {
      throw new Error(
        "Critical Error: Root node 'sys:root' not found after rebuild.",
      );
    }

    return rootNode;
  }

  private domainToRaw(domain: UserTypeEntity): RawEpType {
    return {
      id: domain.id,
      icon: domain.icon,
      kind: domain.kind,
      title: domain.title,
      propertiesScheme: domain.propertiesScheme,
    };
  }

  async create(
    type: Omit<UserTypeEntity, "kind">,
    parentId: EpTypeId = "sys:root",
  ): Promise<UserTypeEntity> {
    const userType: UserTypeEntity = {
      id: type.id,
      title: type.title,
      icon: type.icon,
      kind: "user",
      propertiesScheme: type.propertiesScheme,
    };

    this.flattenTree.set(userType.id, this.domainToRaw(userType));
    this.typeTreeEdges.push({ source: parentId, target: userType.id });

    this.typeTree = this.rebuildTreeFromFlatState();

    await this.saveState();

    return userType;
  }

  async update(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: UserTypeEntity,
  ): Promise<UserTypeEntity | undefined> {
    if (!this.flattenTree.has(id)) {
      return undefined;
    }
    const userType: UserTypeEntity = {
      id: newData.id,
      title: newData.title,
      icon: newData.icon,
      kind: newData.kind,
      propertiesScheme: newData.propertiesScheme,
    };

    this.flattenTree.set(userType.id, this.domainToRaw(userType));
    this.typeTree = this.rebuildTreeFromFlatState();

    this.saveState();

    return newData;
  }

  async remove(
    id: Exclude<EpTypeId, SystemTypeId | DefaultTypeId>,
  ): Promise<boolean> {
    await this.index();
    const descendants = await this.getDescendants(id);

    if (descendants && descendants.length > 0) {
      return false;
    }

    if (!this.flattenTree.has(id)) {
      return false;
    }

    this.flattenTree.delete(id);
    const edgeIndex = this.typeTreeEdges.findIndex((it) => it.target === id);
    if (edgeIndex > -1) {
      this.typeTreeEdges.splice(edgeIndex, 1);
    }

    this.typeTree = this.rebuildTreeFromFlatState();

    return true;
  }
  getPropsScheme(id: EpTypeId): BasePropertiesScheme {
    const ancestors = this.getAncestors(id);
    const currentType = this.flattenTree.get(id);

    const aggregatedPropertiesScheme: BasePropertiesScheme = {
      order: [],
      props: {},
    };

    for (const ancestor of ancestors) {
      const type = this.flattenTree.get(ancestor);

      if (!type?.propertiesScheme) continue;

      const clonedProps = structuredClone(type.propertiesScheme.props);
      Object.assign(aggregatedPropertiesScheme.props, clonedProps);

      aggregatedPropertiesScheme.order.push(...type.propertiesScheme.order);
    }

    if (currentType?.propertiesScheme) {
      const clonedProps = structuredClone(currentType.propertiesScheme.props);
      Object.assign(aggregatedPropertiesScheme.props, clonedProps);

      aggregatedPropertiesScheme.order.push(
        ...currentType.propertiesScheme.order,
      );
    }

    return {
      order: [...new Set(aggregatedPropertiesScheme.order)],
      props: aggregatedPropertiesScheme.props,
    };
  }
  async inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean> {
    await this.index();

    const movedNode = this.flattenTree.get(childId);
    const destinationNode = this.flattenTree.get(parentId);

    if (!movedNode || !destinationNode) return false;

    const oldIndex = this.typeTreeEdges.findIndex(
      (it) => it.target === childId,
    );
    if (oldIndex > -1) {
      this.typeTreeEdges.splice(oldIndex, 1);
    }

    this.typeTreeEdges.push({ source: parentId, target: childId });
    this.typeTree = this.rebuildTreeFromFlatState();

    return true;
  }

  async getTree(): Promise<TypeHierarchyNode> {
    return this.convertTypeHierarchy(this.typeTree);
  }
}
