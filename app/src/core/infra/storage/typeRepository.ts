import type { TypingRepositoryContract } from "@/core/domain/repositories/typesRepositoryContract";
import type {
  EpTypeEntity,
  UserTypeEntity,
  TypeHierarchyNode,
  _TypeKind,
  BasePropertiesScheme,
} from "@/core/domain/type";
import type { EpTypeId, SystemTypeId } from "@/core/types";
import { deepTraversal, extractTreeEdges, type Edge } from "../utils";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import type { RawEptTypeHierarchyNode, RawEpType } from "./type";

const ROOT: RawEptTypeHierarchyNode = {
  id: "sys:root",
  type: {
    id: "sys:root",
    title: "root",
    kind: "system",
    propertiesScheme: {
      order: ["isContainer"],
      props: {
        isContainer: {
          id: "isContainer",
          title: "isContainer",
          type: "boolean",
        },
      },
    },
  },
  children: [
    {
      id: "sys:page",
      type: {
        id: "sys:page",
        title: "Page",
        icon: {
          type: "default",
          name: "page",
        },
        kind: "system",
      },
      children: [],
    },
    {
      id: "def:text",
      type: {
        id: "def:text",
        title: "Text",
        kind: "default",
      },
      children: [
        {
          id: "def:latex",
          type: {
            id: "def:latex",
            title: "LaTeX",
            kind: "default",
          },
          children: [],
        },
        {
          id: "def:code",
          type: {
            id: "def:code",
            title: "Code",
            kind: "default",
            propertiesScheme: {
              order: ["codeLanguage"],
              props: {
                isContainer: {
                  id: "codeLanguage",
                  title: "codeLanguage",
                  type: "text",
                },
              },
            },
          },
          children: [],
        },
      ],
    },
  ],
};

export class TypingRepository implements TypingRepositoryContract {
  private readonly typesStorageApi: FileSystemApi<RawEptTypeHierarchyNode>;
  private readonly MAIN_TYPES_OBJECT_PATH = "./types.json";

  private typeTree: RawEptTypeHierarchyNode = ROOT;
  private flattenTreeCache: Map<string, RawEpType> = new Map(); // FIXME
  private typeTreeEdges: Edge<EpTypeId>[] = [];
  private descendantCache: Map<string, EpTypeId[]> = new Map(); // FIXME

  constructor(userStorageApi: FileSystemApi<RawEptTypeHierarchyNode>) {
    this.typesStorageApi = userStorageApi;
  }

  private async loadTree(): Promise<RawEptTypeHierarchyNode> {
    const rawTree = await this.typesStorageApi.get(this.MAIN_TYPES_OBJECT_PATH);
    if (!rawTree) {
      await this.typesStorageApi.save(this.MAIN_TYPES_OBJECT_PATH, ROOT);
      return ROOT;
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

    traverse(root.children, cache);

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
    return this.descendantCache;
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
    ); // TODO: Optimize

    for (const [id, value] of Object.entries(rawDescendants)) {
      this.descendantCache.set(id, value);
    }

    this.flattenTreeCache = this.flatten(rawTree);
    this.typeTreeEdges = rawTreeEdges;
    this.typeTree = rawTree;
  }

  private getNodeContext = (id: EpTypeId, path: EpTypeId[] = []) => {
    let parentArray: RawEptTypeHierarchyNode[] = [this.typeTree];
    let node: RawEptTypeHierarchyNode | undefined = undefined;

    for (let i = 0; i < path.length; i++) {
      node = parentArray.find((el) => el.id === path[i]);

      if (node && i < path.length - 1) {
        if (!node.children) {
          node.children = [];
        }
        parentArray = node.children;
      }
    }

    const fNode = parentArray.find((el) => el.id === id);
    return { node: fNode, parentArray: parentArray };
  };

  private async saveState(): Promise<void> {
    this.typesStorageApi.save(this.MAIN_TYPES_OBJECT_PATH, this.typeTree);
    await this.index();
  }

  async get(id: EpTypeId): Promise<EpTypeEntity | undefined> {
    const result = this.flattenTreeCache.get(id);
    if (!result) {
      return undefined;
    }
    return this.convertRawTypeToEntity(result);
  }

  async getAll(): Promise<EpTypeEntity[]> {
    return Array.from(this.flattenTreeCache.values()).map((it) =>
      this.convertRawTypeToEntity(it),
    );
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

    const newNode: TypeHierarchyNode = {
      id: userType.id,
      type: userType,
      children: [],
    };

    const path = this.descendantCache.get(parentId) || [];
    const parentContext = this.getNodeContext(parentId, path);

    if (parentContext.node) {
      if (!parentContext.node.children) parentContext.node.children = [];
      parentContext.node.children.push(newNode);
    }

    this.saveState();
    return userType;
  }

  async update(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: UserTypeEntity,
  ): Promise<UserTypeEntity | undefined> {
    const path = this.descendantCache.get(id);
    const context = this.getNodeContext(id, path);

    if (!context.node) {
      return undefined;
    }
    context.node.type = newData;
    this.saveState();

    return newData;
  }

  async remove(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean> {
    await this.index();
    const descendants = await this.getDescendants(id);

    if (descendants && descendants.length > 0) {
      return false;
    }

    const path = this.descendantCache.get(id);
    const nodeContext = this.getNodeContext(id, path);

    const oldIndex = nodeContext.parentArray.findIndex((n) => n.id === id);
    if (oldIndex > -1) {
      nodeContext.parentArray.splice(oldIndex, 1);
      this.saveState();
      return true;
    }

    return false;
  }

  getFullPropsScheme(id: EpTypeId): BasePropertiesScheme {
    const ancestors = this.getAncestors(id);

    const aggregatedPropertiesScheme: BasePropertiesScheme = {
      order: [],
      props: {},
    };

    for (const ancestor of ancestors) {
      const type = this.flattenTreeCache.get(ancestor);

      if (!type?.propertiesScheme) {
        continue;
      }

      aggregatedPropertiesScheme.order.concat(type.propertiesScheme.order);
      for (const [id, dPropsSchemeEntry] of Object.entries(
        type.propertiesScheme.props,
      )) {
        aggregatedPropertiesScheme.props[id] = dPropsSchemeEntry;
        aggregatedPropertiesScheme.order.push(id);
      }
    }
    return aggregatedPropertiesScheme;
  }

  async inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean> {
    await this.index();

    const movedNode = this.getNodeContext(
      childId,
      this.descendantCache.get(childId),
    );
    const destinationNode = this.getNodeContext(
      parentId,
      this.descendantCache.get(parentId),
    );

    if (!movedNode.node || !destinationNode.node) return false;

    const oldIndex = movedNode.parentArray.findIndex((n) => n.id === childId);
    if (oldIndex > -1) {
      movedNode.parentArray.splice(oldIndex, 1);
    }

    if (!destinationNode.node.children) {
      destinationNode.node.children = [];
    }
    destinationNode.node.children.push(movedNode.node);

    await this.saveState();
    return true;
  }

  async getTree(): Promise<TypeHierarchyNode> {
    return this.convertTypeHierarchy(this.typeTree);
  }
}
