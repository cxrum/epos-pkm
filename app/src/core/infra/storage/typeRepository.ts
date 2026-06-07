import type { TypingRepositoryContract } from "@/core/domain/repositories/typesRepositoryContract";
import type {
  EpTypeEntity,
  UserTypeEntity,
  TypeHierarchyNode,
} from "@/core/domain/type";
import type { EpTypeId, SystemTypeId } from "@/core/types";
import {
  deepTraversal,
  extractTreeEdges,
  flattenTree,
  type Edge,
} from "../utils";
import type { FileSystemApi } from "../../../../fileSystemApiContract";
import type { RawEpType } from "./type";

const ROOT: TypeHierarchyNode = {
  id: "sys:root",
  type: {
    id: "sys:root",
    title: "root",
    kind: "system",
  },
  children: [
    {
      id: "sys:page",
      type: {
        id: "sys:page",
        title: "root",
        icon: {
          type: "default",
          name: "document",
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
          },
          children: [],
        },
      ],
    },
  ],
};

export class TypingRepository implements TypingRepositoryContract {
  private readonly typesStorageApi: FileSystemApi<RawEpType>;

  private descendantCache: Record<EpTypeId, EpTypeId[]>;
  private typeTree: TypeHierarchyNode;
  private typeTreeEdges: Edge<EpTypeId>[];

  constructor(userStorageApi: FileSystemApi<RawEpType>) {
    this.typesStorageApi = userStorageApi;
    const tree: TypeHierarchyNode = this.loadTreeFromBd();
    const edges: Edge<EpTypeId>[] = extractTreeEdges(tree, "id", "children");

    this.descendantCache = deepTraversal(tree, "id", "children");
    this.typeTree = tree;
    this.typeTreeEdges = edges;
  }

  private loadTreeFromBd(): TypeHierarchyNode {
    return ROOT;
  }

  private getNodeContext = (id: EpTypeId, path: EpTypeId[] = []) => {
    let parentArray: TypeHierarchyNode[] = [this.typeTree];
    let node: TypeHierarchyNode | undefined = undefined;

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

  private flattTree(tree: TypeHierarchyNode): EpTypeEntity[] {
    return flattenTree(tree, "children").map((val) => val.type);
  }

  async get(id: EpTypeId): Promise<EpTypeEntity | undefined> {
    const path = this.descendantCache[id];
    return this.getNodeContext(id, path).node?.type;
  }

  async getAll(): Promise<EpTypeEntity[]> {
    return this.flattTree(await this.getTree());
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
    };

    const newNode: TypeHierarchyNode = {
      id: userType.id,
      type: userType,
      children: [],
    };

    const path = this.descendantCache[parentId] || [];
    const parentContext = this.getNodeContext(parentId, path);

    if (parentContext.node) {
      if (!parentContext.node.children) parentContext.node.children = [];
      parentContext.node.children.push(newNode);
    }

    await this.index();

    return userType;
  }

  async update(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: UserTypeEntity,
  ): Promise<UserTypeEntity | undefined> {
    const path = this.descendantCache[id];
    const context = this.getNodeContext(id, path);

    if (context.node) {
      context.node.type = newData;
      await this.index();
      return newData;
    }

    return undefined;
  }

  async remove(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean> {
    await this.index();
    const descendants = await this.getDescendants(id);

    if (descendants && descendants.length > 0) {
      return false;
    }

    const path = this.descendantCache[id];
    const nodeContext = this.getNodeContext(id, path);

    const oldIndex = nodeContext.parentArray.findIndex((n) => n.id === id);
    if (oldIndex > -1) {
      nodeContext.parentArray.splice(oldIndex, 1);
      return true;
    }

    return false;
  }

  async inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean> {
    await this.index();

    const movedNode = this.getNodeContext(
      childId,
      this.descendantCache[childId],
    );
    const destinationNode = this.getNodeContext(
      parentId,
      this.descendantCache[parentId],
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

    await this.index();
    return true;
  }

  async index(): Promise<void> {
    this.descendantCache = deepTraversal(this.typeTree, "id", "children");
    this.typeTreeEdges = extractTreeEdges(this.typeTree, "id", "children");
  }

  async getTree(): Promise<TypeHierarchyNode> {
    return this.typeTree ?? (await this.loadTreeFromBd());
  }

  async getAncestors(id: EpTypeId): Promise<EpTypeId[]> {
    await this.index();
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

  async getDescendants(id: EpTypeId): Promise<EpTypeId[]> {
    await this.index();
    return this.typeTreeEdges
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target);
  }
}
