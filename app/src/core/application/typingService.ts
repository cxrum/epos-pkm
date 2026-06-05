import type { TypingRepositoryContract } from "@/core/domain/repositories/typesRepositoryContract";
import type { EpTypeId, SystemTypeId } from "@/core/types";
import type { TypingServiceContract } from "../store/services/typingEngineContract";
import { toEpType, type EpType } from "./types";
import { createCompanionEpTypeEntity, type EpTypeEntity } from "../domain/type";

export class TypingService implements TypingServiceContract {
  private readonly typingRepository: TypingRepositoryContract;

  constructor(typingRepository: TypingRepositoryContract) {
    this.typingRepository = typingRepository;
  }

  async getType(id: EpTypeId): Promise<EpType | undefined> {
    return await this.typingRepository.get(id);
  }

  async getAllTypes(): Promise<EpType[]> {
    return await this.typingRepository.getAll();
  }

  async createType(type: EpType): Promise<EpType> {
    return toEpType(await this.typingRepository.create(type));
  }

  async updateType(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: Partial<EpType>,
  ): Promise<EpType | undefined> {
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

    return result ? toEpType(result) : undefined;
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

  async getDescendants(parentType: EpTypeId): Promise<EpType[]> {
    const descendants = await this.typingRepository.getDescendants(parentType);
    const result: EpType[] = [];

    for (const val in descendants) {
      const res = await this.typingRepository.get(val);
      if (res) {
        result.push(res);
      }
    }

    return result;
  }
}
