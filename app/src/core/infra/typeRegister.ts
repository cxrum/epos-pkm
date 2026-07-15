import type { BasePropertiesScheme, EpTypeEntity } from "../domain/type";
import type { TypeRegisterContract } from "../domain/typeRegisterContract";
import type { EpTypeId } from "../types";
import type { RawEptTypeHierarchyNode, RawEpType } from "./storage/type";

export class TypeRegister implements TypeRegisterContract {
  private nodes: Map<string, EpTypeEntity> = new Map();
  private edges: Record<EpTypeId, EpTypeId[]> = {};

  public register(schema: EpTypeEntity): void {
    this.nodes.set(schema.id, schema);
  }

  public get(id: string): EpTypeEntity | undefined {
    return this.nodes.get(id);
  }

  public registerEdge(parentId: EpTypeId, childId: EpTypeId): void {
    if (!this.edges[parentId]) {
      this.edges[parentId] = [];
    }

    if (!this.edges[parentId].includes(childId)) {
      this.edges[parentId].push(childId);
    }
  }

  public getJSONRepresentation(): RawEptTypeHierarchyNode[] {
    return Array.from(this.nodes.values()).map((typeSchema) => ({
      id: typeSchema.id,
      type: this.domainToRaw(typeSchema),
      children: [],
    }));
  }

  private domainToRaw(domain: EpTypeEntity): RawEpType {
    return {
      id: domain.id,
      icon: domain.icon,
      kind: domain.kind,
      title: domain.title,
      propertiesScheme: domain.propertiesScheme,
    };
  }

  public systemRoot(): RawEptTypeHierarchyNode {
    if (!this.nodes.has("sys:root")) {
      throw new Error("Root node 'sys:root' is not registered.");
    }

    return this.buildNodeTree("sys:root");
  }

  private buildNodeTree(nodeId: EpTypeId): RawEptTypeHierarchyNode {
    const domainEntity = this.nodes.get(nodeId);
    if (!domainEntity) {
      throw new Error(
        `Node '${nodeId}' referenced in edges but not registered.`,
      );
    }

    const rawType = this.domainToRaw(domainEntity);

    const node: RawEptTypeHierarchyNode = {
      id: nodeId,
      type: rawType,
      children: [],
    };

    const childrenIds = this.edges[nodeId] || [];

    node.children = childrenIds.map((childId) => this.buildNodeTree(childId));

    return node;
  }
}
