import type {
  Icon,
  EpObjectId,
  EpTypeId,
  SystemTypeId,
  DefaultTypeId,
} from "../types";

export interface TypeHierarchyNode {
  id: EpTypeId;
  type: EpTypeEntity;
  children: TypeHierarchyNode[];
}

interface BaseTypeEntity {
  icon?: Icon;
  title: string;
}

export interface DefaultTypeEntity extends BaseTypeEntity {
  id: DefaultTypeId;
  kind: "default";
}

export interface SystemTypeEntity extends BaseTypeEntity {
  id: SystemTypeId;
  kind: "system";
}

export interface UserTypeEntity extends BaseTypeEntity {
  id: EpTypeId;
  kind: "user";
}

export type EpTypeEntity =
  | SystemTypeEntity
  | DefaultTypeEntity
  | UserTypeEntity;

export const createCompanionEpTypeEntity = () => {
  const isInheritable = (
    parent: EpTypeEntity,
    children: EpTypeEntity,
  ): boolean => {
    if (
      children.kind === "system" ||
      children.kind === "default" ||
      parent.id === children.id
    ) {
      return false;
    }

    return true;
  };

  return {
    isInheritable,
  };
};

export interface BaseEpObjectEntity<
  TType extends EpTypeId = EpTypeId,
  TContent = Record<string, any>,
> {
  id: EpObjectId;
  typeId: TType;
  path: string;
  content: TContent;
}

export interface PageContent {
  title: string;
  inlineObjects: Record<string, any>;
}

export type ContainerObjectEntity = BaseEpObjectEntity<"sys:page", PageContent>;
export type EpObjectEntity = ContainerObjectEntity | BaseEpObjectEntity;

export interface ObjectHierarchyNode {
  id: EpObjectId;
  typeId: EpTypeId;
  children: ObjectHierarchyNode[];
}
