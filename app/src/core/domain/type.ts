import type {
  Icon,
  EpObjectId,
  EpTypeId,
  SystemTypeId,
  DefaultTypeId,
  EpPropertyId,
  EpPropertyTypes,
} from "../types";

type _TypeKind = "default" | "system" | "user";

export interface BasePropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
> {
  id: TProperty;
  title: string;
  type: TPropertyType;
}

export interface ValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TValue = unknown,
> extends BasePropertySchemeEntry<TProperty, TPropertyType> {
  value: TValue;
}

export interface BooleanValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
> extends ValuedPropertyEntry<TProperty, "boolean", boolean> {}

export interface NumberValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
> extends ValuedPropertyEntry<TProperty, "number", number> {}

export interface SelectPropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
> extends BasePropertySchemeEntry<TProperty, "select"> {
  options: { id: string; title: string; color?: string }[];
}

export interface SelectValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
> extends SelectPropertySchemeEntry<TProperty> {
  value: string | string[];
}

export interface TextValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
> extends ValuedPropertyEntry<TProperty, "text", string> {}

export type AnyValidPropertyEntry =
  | BooleanValuedPropertyEntry<string>
  | NumberValuedPropertyEntry<string>
  | SelectValuedPropertyEntry<string>
  | TextValuedPropertyEntry<string>;

export type SystemPropertiesMap = {
  isContainer: BooleanValuedPropertyEntry<"isContainer">;
};

export type DynamicPropertiesMap = {
  [key: string]: AnyValidPropertyEntry;
};

export type AllPropertiesMap = SystemPropertiesMap & DynamicPropertiesMap;

export interface BaseProperties {
  props: AllPropertiesMap;
}

export interface BasePropertiesScheme {
  order: EpPropertyId[];
  props: AllPropertiesMap;
}

interface BaseTypeEntity<
  TTypeId extends EpTypeId,
  TKind extends _TypeKind,
  TProperties extends Record<string, any> = BasePropertiesScheme,
> {
  id: TTypeId;
  kind: TKind;
  icon?: Icon;
  title: string;
  properties: TProperties;
}

export interface DefaultTypeEntity extends BaseTypeEntity<
  DefaultTypeId,
  "default"
> {}
export interface SystemTypeEntity extends BaseTypeEntity<
  SystemTypeId,
  "system"
> {}
export interface UserTypeEntity extends BaseTypeEntity<EpTypeId, "user"> {}

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

export interface TypeHierarchyNode {
  id: EpTypeId;
  type: EpTypeEntity;
  children: TypeHierarchyNode[];
}

export interface BaseEpObjectEntity<
  TType extends EpTypeId = EpTypeId,
  TContent = Record<string, any>,
> extends BaseProperties {
  id: EpObjectId;
  typeId: TType;
  path: string;
  content: TContent;
}

export interface PageContent {
  title: string;
  order: EpObjectId[];
  inlineObjects: Record<EpObjectId, any>;
}

export interface ContainerObjectEntity extends BaseEpObjectEntity<
  "sys:page",
  PageContent
> {}

export type EpObjectEntity = ContainerObjectEntity | BaseEpObjectEntity;

export interface ObjectHierarchyNode {
  id: EpObjectId;
  typeId: EpTypeId;
  children: ObjectHierarchyNode[];
}
