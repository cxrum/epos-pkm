import type { DefaultTypeId, EpTypeId, SystemTypeId } from "@/core/types";
import type {
  BasePropertiesScheme,
  EpTypeEntity,
  TypeHierarchyNode,
  UserTypeEntity,
} from "../type";

export interface TypingRepositoryContract {
  init(): Promise<void>;
  get(id: EpTypeId): Promise<EpTypeEntity | undefined>;
  getAll(): Promise<EpTypeEntity[]>;
  create(type: Omit<UserTypeEntity, "kind">): Promise<UserTypeEntity>;
  update(
    id: Exclude<EpTypeId, SystemTypeId>,
    newData: UserTypeEntity,
  ): Promise<UserTypeEntity | undefined>;
  remove(id: Exclude<EpTypeId, SystemTypeId | DefaultTypeId>): Promise<boolean>;

  inherit(
    parentId: EpTypeId,
    childId: Exclude<EpTypeId, SystemTypeId>,
  ): Promise<boolean>;
  getFullPropsScheme(id: EpTypeId): BasePropertiesScheme;
  index(): void;
  getTree(): Promise<TypeHierarchyNode>;
  getAncestors(id: EpTypeId): EpTypeId[];
  getDescendants(id: EpTypeId): EpTypeId[];
  getAllDescendants(): Map<EpTypeId, EpTypeId[]>;
}
