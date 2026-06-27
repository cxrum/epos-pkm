import type { TypingRepositoryContract } from "@/core/domain/repositories/typesRepositoryContract";
import type {
  EpPropertyId,
  EpPropertyType,
  EpTypeId,
  Icon,
  SystemTypeId,
} from "@/core/types";
import type { TypingServiceContract } from "../store/services/typingEngineContract";
import {
  createCompanionEpTypeEntity,
  isSystemProperty,
  type BasePropertiesScheme,
  type EpTypeEntity,
  type TypeHierarchyNode,
} from "../domain/type";
import type { Edge } from "../infra/utils";
import type { TreeNode } from "@/shared/components/tree/contract";
import type { AncestorType, PropertiesScheme, PropertyEntry } from "./type";
import { convertDomainProperties } from "./utils";

export class TypingService implements TypingServiceContract {
  private readonly typingRepository: TypingRepositoryContract;

  constructor(typingRepository: TypingRepositoryContract) {
    this.typingRepository = typingRepository;
  }

  async get(id: EpTypeId): Promise<EpTypeEntity | undefined> {
    return await this.typingRepository.get(id);
  }

  async getAllTypes(): Promise<EpTypeEntity[]> {
    return await this.typingRepository.getAll();
  }

  getEdges(): Edge<EpTypeId>[] {
    return this.typingRepository.getEdges();
  }

  async getTree(): Promise<TreeNode> {
    const rawTree = await this.typingRepository.getTree();
    const convertor = async (
      rawRoot: TypeHierarchyNode,
      cache: Map<EpTypeId, TreeNode> = new Map(),
    ): Promise<TreeNode> => {
      if (cache.has(rawRoot.id)) {
        return cache.get(rawRoot.id)!;
      }

      const type = await this.typingRepository.get(rawRoot.id);
      const newNode: TreeNode = {
        id: rawRoot.id,
        icon: type?.icon ?? { type: "default", name: "object" },
        title: type?.title ?? "Unknown",
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

    return await convertor(rawTree);
  }

  async createType(type: EpTypeEntity): Promise<EpTypeEntity> {
    return await this.typingRepository.create(type);
  }

  async updateType(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: Partial<EpTypeEntity>,
  ): Promise<EpTypeEntity | undefined> {
    const existingType = await this.typingRepository.get(id);

    if (!existingType || existingType.kind === "system") {
      return undefined;
    }

    const updatedType: EpTypeEntity = {
      ...existingType,
      ...newData,
      id,
      kind: "user",
    };

    const result = await this.typingRepository.update(id, updatedType);

    return result ?? undefined;
  }

  async deleteType(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean> {
    return await this.typingRepository.remove(id);
  }

  async inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean> {
    const parentType = await this.typingRepository.get(parentId);
    const childrenType = await this.typingRepository.get(childId);
    if (!parentType || !childrenType) {
      throw new Error(`Inheritance failed`);
    }

    const hierarchyPermission = createCompanionEpTypeEntity().isInheritable(
      parentType,
      childrenType,
    );

    if (!hierarchyPermission) {
      throw new Error(`Inheritance failed: Hierarchy error`);
    }

    const isInheritable = await this.isInheritable(parentId, childId);

    if (!isInheritable) {
      throw new Error(
        `Inheritance failed: Circular dependency detected between parent (${parentId}) and child (${childId}).`,
      );
    }

    return await this.typingRepository.inherit(parentId, childId);
  }

  async removeInheritance(
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<void> {
    await this.typingRepository.inherit("sys:root", childId);
  }

  async isInheritable(parentId: EpTypeId, childId: EpTypeId): Promise<boolean> {
    if (parentId === childId) return false;
    const ancestors = await this.typingRepository.getAncestors(parentId);

    if (ancestors.includes(childId)) {
      return false;
    }

    return true;
  }

  async checkCompatibility(
    parentType: EpTypeId,
    childType: EpTypeId,
  ): Promise<boolean> {
    if (parentType === childType) return true;
    const descendants = await this.typingRepository.getDescendants(parentType);

    return descendants.includes(childType);
  }

  async getDescendants(parentType: EpTypeId): Promise<EpTypeEntity[]> {
    const descendants = await this.typingRepository.getDescendants(parentType);
    const result: EpTypeEntity[] = [];

    for (const val of descendants) {
      const res = await this.typingRepository.get(val);
      if (res) {
        result.push(res);
      }
    }

    return result;
  }

  async getAncestors(type: EpTypeId): Promise<EpTypeEntity[]> {
    const descendants = await this.typingRepository.getAncestors(type);
    const result: EpTypeEntity[] = [];

    for (const val of descendants) {
      const res = await this.typingRepository.get(val);
      if (res) {
        result.push(res);
      }
    }

    return result;
  }

  async getFullPropsScheme(typeId: EpTypeId): Promise<PropertiesScheme> {
    const ancestors = await this.typingRepository.getAncestors(typeId);
    const currentType = await this.typingRepository.get(typeId);

    const aggregatedPropertiesScheme: PropertiesScheme = {
      inheritance: new Map(),
      order: [],
      props: new Map(),
    };

    for (const ancestorId of ancestors) {
      const ancestorType = await this.typingRepository.get(ancestorId);
      if (!ancestorType?.propertiesScheme) continue;

      const ancestorMeta: AncestorType = {
        id: ancestorType.id,
        title: ancestorType.title,
        icon: ancestorType.icon,
      };

      const convertedProps = convertDomainProperties(
        ancestorType.propertiesScheme,
      );

      for (const prop of convertedProps) {
        prop.parentType = ancestorMeta;

        aggregatedPropertiesScheme.inheritance.set(prop.id, ancestorType.id);
        aggregatedPropertiesScheme.props.set(prop.id, prop);
      }

      aggregatedPropertiesScheme.order.push(
        ...ancestorType.propertiesScheme.order,
      );
    }

    if (currentType?.propertiesScheme) {
      const convertedProps = convertDomainProperties(
        currentType.propertiesScheme,
      );

      for (const prop of convertedProps) {
        prop.parentType = undefined;
        aggregatedPropertiesScheme.props.set(prop.id, prop);
      }

      aggregatedPropertiesScheme.order.push(
        ...currentType.propertiesScheme.order,
      );
    }

    return {
      inheritance: aggregatedPropertiesScheme.inheritance,
      order: [...new Set(aggregatedPropertiesScheme.order)],
      props: aggregatedPropertiesScheme.props,
    };
  }

  async getPropsScheme(typeId: EpTypeId): Promise<PropertiesScheme> {
    const type = await this.typingRepository.get(typeId);
    const rawScheme = type ? type.propertiesScheme : undefined;

    const resultScheme: PropertiesScheme = {
      inheritance: new Map(),
      order: rawScheme?.order ?? [],
      props: new Map(),
    };

    if (type && rawScheme) {
      const convertedProps = convertDomainProperties(rawScheme);

      for (const prop of convertedProps) {
        resultScheme.props.set(prop.id, prop);
      }
    }

    return resultScheme;
  }
}
