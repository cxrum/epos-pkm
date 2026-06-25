import type {
  Icon,
  EpObjectId,
  EpTypeId,
  SystemTypeId,
  DefaultTypeId,
  EpPropertyId,
  EpPropertyTypes,
  ObjectPath,
  UserTypeId,
} from "../types";

export type _TypeKind = "default" | "system" | "user";
export type _PropertyKind = "system" | "user";

export interface BasePropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> {
  id: TProperty;
  title: string;
  type: TPropertyType;
  isChangeable: TisChangeable;
  kind: TKind;
}

export type PropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TisChangeable extends boolean = boolean,
> = BasePropertySchemeEntry<TProperty, TPropertyType, "user", TisChangeable>;

export type SystemPropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TisChangeable extends boolean = boolean,
> = BasePropertySchemeEntry<TProperty, TPropertyType, "system", TisChangeable>;

export type ValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TValue = unknown,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = BasePropertySchemeEntry<TProperty, TPropertyType, TKind, TisChangeable> & {
  value: TValue;
};

export type UserValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TValue = unknown,
> = ValuedPropertyEntry<TProperty, TPropertyType, TValue, "user">;

export type SystemValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TPropertyType extends EpPropertyTypes = EpPropertyTypes,
  TValue = unknown,
  TisChangeable extends boolean = boolean,
> = ValuedPropertyEntry<
  TProperty,
  TPropertyType,
  TValue,
  "system",
  TisChangeable
>;

export type BooleanValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = ValuedPropertyEntry<TProperty, "boolean", boolean, TKind, TisChangeable>;

export type NumberValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = ValuedPropertyEntry<TProperty, "number", number, TKind, TisChangeable>;

export type TextValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = ValuedPropertyEntry<TProperty, "text", string, TKind, TisChangeable>;

export type SelectPropertySchemeEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = BasePropertySchemeEntry<TProperty, "select", TKind, TisChangeable> & {
  options: { id: string; title: string; color?: string }[];
};

export type SelectValuedPropertyEntry<
  TProperty extends EpPropertyId = EpPropertyId,
  TKind extends _PropertyKind = _PropertyKind,
  TisChangeable extends boolean = boolean,
> = SelectPropertySchemeEntry<TProperty, TKind, TisChangeable> & {
  value: string | string[];
};

export type AnyValidPropertyEntry =
  | BooleanValuedPropertyEntry<string>
  | NumberValuedPropertyEntry<string>
  | TextValuedPropertyEntry<string>
  | SelectValuedPropertyEntry<string>;

export type IsContainerValuedProperty = BooleanValuedPropertyEntry<
  "isContainer",
  "system",
  false
>;

export type SystemPropertiesMap = {
  isContainer: IsContainerValuedProperty;
};

export type DynamicPropertiesMap = {
  [key: string]: AnyValidPropertyEntry;
};

export type AllPropertiesMap = SystemPropertiesMap & DynamicPropertiesMap;

export interface BasePropertiesScheme {
  order: EpPropertyId[];
  props: Record<string, BasePropertySchemeEntry>;
}

export function isSystemProperty(
  property: BasePropertySchemeEntry,
): property is SystemPropertySchemeEntry {
  return property.kind === "system";
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
  propertiesScheme: TProperties;
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

export function isSystemType(type: EpTypeEntity): type is SystemTypeEntity {
  return type.kind === "system";
}

export function isDefaultType(type: EpTypeEntity): type is DefaultTypeEntity {
  return type.kind === "default";
}

export function isUserType(type: EpTypeEntity): type is UserTypeEntity {
  return type.kind === "user";
}

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
  TProperties extends Record<string, AnyValidPropertyEntry> = AllPropertiesMap,
> {
  id: EpObjectId;
  typeId: TType;
  physicalRelativePath: string;
  objectPath: ObjectPath;
  content: TContent;
  props: TProperties;
}

export interface PageContent {
  title: string;
  order: EpObjectId[];
  inlineObjects: Record<EpObjectId, EpInlineObjectEntity>;
}

type WithContainerFlag<T extends boolean> = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: BooleanValuedPropertyEntry<"isContainer", "system"> & {
    value: T;
  };
};

// MOUNTED CONTAINER LINK --------------------------------------------------
export type MountedContainerPropertiesMap = WithContainerFlag<false>;

export interface MountedContainerObjectContent {
  toId: EpObjectId;
}

export type MountedContainerObjectEntity = BaseEpObjectEntity<
  "sys:hard-page-link",
  MountedContainerObjectContent,
  MountedContainerPropertiesMap
>;

export function isMountedContainerEntity(
  entity: EpObjectEntity,
): entity is MountedContainerObjectEntity {
  return entity.typeId === "sys:hard-page-link";
}
// MOUNTED CONTAINER LINK --------------------------------------------------

// SYSTEM CONTAINER --------------------------------------------------------
export type SystemContainerEntity = BaseEpObjectEntity<
  "sys:container",
  PageContent,
  AllPropertiesMap
>;

export function isContainerEntity(
  entity: EpObjectEntity,
): entity is SystemContainerEntity {
  return entity.typeId === "sys:container";
}
// SYSTEM CONTAINER --------------------------------------------------------

// WORKSPACE CONTAINER -----------------------------------------------------
export type WorkspacePropertiesMap = WithContainerFlag<true>;

export type WorkspaceEntity = BaseEpObjectEntity<
  "sys:workspace",
  Record<string, any>,
  WorkspacePropertiesMap
>;

export function isWorkspaceEntity(
  entity: EpObjectEntity,
): entity is WorkspaceEntity {
  return entity.typeId === "sys:workspace";
}
// WORKSPACE CONTAINER --------------------------------------------------------

// STANDARD INLINE OBJECT  -------------------------------------------------
export type SystemInlinePropertiesMap = WithContainerFlag<false>;

export type StandardInlineEntity = BaseEpObjectEntity<
  SystemTypeId,
  Record<string, any>,
  SystemInlinePropertiesMap
>;

export function isSystemInlineEntity(
  entity: EpObjectEntity,
): entity is StandardInlineEntity {
  return (
    entity.props.isContainer?.value === false &&
    entity.typeId !== "sys:hard-page-link"
  );
}
// STANDARD INLINE OBJECT  -------------------------------------------------

// HEADING INLINE OBJECT  -----------------------------------------------------
export type HeadingObjectPropertiesMap = WithContainerFlag<false> & {
  level: NumberValuedPropertyEntry<"level", "system", true> & {
    value: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

export type HeadingObjectEntity = BaseEpObjectEntity<
  DefaultTypeId,
  Record<string, any>,
  HeadingObjectPropertiesMap
>;

export function isHeadingInlineEntity(
  entity: EpObjectEntity,
): entity is HeadingObjectEntity {
  return entity.typeId === "def:heading";
}
// HEADING INLINE OBJECT  --------------------------------------------------

// TEXT INLINE OBJECT  -----------------------------------------------------
export type TextObjectEntity = BaseEpObjectEntity<
  DefaultTypeId,
  Record<string, any>,
  SystemInlinePropertiesMap
>;

export function isAnyText(
  entity: EpObjectEntity,
): entity is TextObjectEntity | HeadingObjectEntity {
  return entity.typeId === "def:text" || entity.typeId === "def:heading";
}
// TEXT INLINE OBJECT  -----------------------------------------------------

// USER INLINE OBJECT  -----------------------------------------------------
export type CustomInlinePropertiesMap = WithContainerFlag<false>;

export type CustomInlineEntity = BaseEpObjectEntity<
  UserTypeId,
  Record<string, any>,
  CustomInlinePropertiesMap
>;

export function isAnyInlineEntity(
  entity: EpObjectEntity,
): entity is CustomInlineEntity | StandardInlineEntity {
  return (
    entity.props.isContainer?.value === false &&
    entity.typeId !== "sys:hard-page-link"
  );
}
// USER INLINE OBJECT  -----------------------------------------------------

// CUSTOM CONTAINER --------------------------------------------------------
export type CustomContainerEntity = BaseEpObjectEntity<
  UserTypeId,
  PageContent,
  AllPropertiesMap
>;

export function isAnyContainer(
  entity: EpObjectEntity,
): entity is SystemContainerEntity | CustomContainerEntity | WorkspaceEntity {
  return entity.props?.isContainer?.value === true;
}
// CUSTOM CONTAINER --------------------------------------------------------

export type EpContainerObjectEntity =
  | WorkspaceEntity
  | SystemContainerEntity
  | CustomContainerEntity;

export type EpInlineObjectEntity =
  | MountedContainerObjectEntity
  | StandardInlineEntity
  | CustomInlineEntity
  | HeadingObjectEntity
  | TextObjectEntity;

export type EpObjectEntity = EpContainerObjectEntity | EpInlineObjectEntity;

export function resolveTitle(entity: EpObjectEntity): string {
  if (isAnyContainer(entity)) {
    return entity.content.title;
  } else if (isAnyInlineEntity(entity)) {
    return "Inline Object";
  }

  return "Unknown";
}

export function isMountedPage(
  entity: EpObjectEntity,
): entity is MountedContainerObjectEntity {
  return entity.typeId === "sys:hard-page-link";
}

export interface ObjectHierarchyNode {
  id: EpObjectId;
  typeId: EpTypeId;
  children: ObjectHierarchyNode[];
}

export type ObjectFilterOptions = {
  types?: EpTypeId[] | EpTypeId;
  descendantTypes?: boolean;
  text?: string;
};
