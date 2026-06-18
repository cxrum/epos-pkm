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

export interface BasePropertiesScheme {
  order: EpPropertyId[];
  props: Record<string, BasePropertySchemeEntry>;
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

// MOUNTED CONTAINER LINK --------------------------------------------------
export type MountedContainerPropertiesMap = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: Omit<BooleanValuedPropertyEntry<"isContainer">, "value"> & {
    value: false;
  };
};

export interface MountedContainerObjectContent {
  toId: EpObjectId;
}

export interface MountedContainerObjectEntity extends BaseEpObjectEntity<
  "sys:hard-page-link",
  MountedContainerObjectContent,
  MountedContainerPropertiesMap
> {}

export function isMountedContainerEntity(
  entity: EpObjectEntity,
): entity is MountedContainerObjectEntity {
  return entity.typeId === "sys:hard-page-link";
}
// MOUNTED CONTAINER LINK --------------------------------------------------

// SYSTEM CONTAINER --------------------------------------------------------
export interface SystemContainerEntity extends BaseEpObjectEntity<
  "sys:container",
  PageContent,
  AllPropertiesMap
> {}

export function isContainerEntity(
  entity: EpObjectEntity,
): entity is SystemContainerEntity {
  return entity.typeId === "sys:container";
}
// SYSTEM CONTAINER --------------------------------------------------------

// WORKSPACE CONTAINER -----------------------------------------------------
export type WorkspacePropertiesMap = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: Omit<BooleanValuedPropertyEntry<"isContainer">, "value"> & {
    value: true;
  };
};

export interface WorkspaceEntity extends BaseEpObjectEntity<
  "sys:workspace",
  Record<string, any>,
  WorkspacePropertiesMap
> {}

export function isWorkspaceEntity(
  entity: EpObjectEntity,
): entity is WorkspaceEntity {
  return entity.typeId === "sys:workspace";
}
// WORKSPACE CONTAINER --------------------------------------------------------

// STANDARD INLINE OBJECT  -------------------------------------------------
export type SystemInlinePropertiesMap = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: Omit<BooleanValuedPropertyEntry<"isContainer">, "value"> & {
    value: false;
  };
};

export interface StandardInlineEntity extends BaseEpObjectEntity<
  SystemTypeId,
  Record<string, any>,
  SystemInlinePropertiesMap
> {}

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
export type HeadingObjectPropertiesMap = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: Omit<BooleanValuedPropertyEntry<"isContainer">, "value"> & {
    value: false;
  };
  level: Omit<NumberValuedPropertyEntry<"level">, "value"> & {
    value: 1 | 2 | 3 | 4 | 5 | 6;
  };
};

export interface HeadingObjectEntity extends BaseEpObjectEntity<
  DefaultTypeId,
  Record<string, any>,
  HeadingObjectPropertiesMap
> {}

export function isHeadingInlineEntity(
  entity: EpObjectEntity,
): entity is HeadingObjectEntity {
  return entity.typeId === "def:heading";
}
// HEADING INLINE OBJECT  --------------------------------------------------

// TEXT INLINE OBJECT  -----------------------------------------------------
export interface TextObjectEntity extends BaseEpObjectEntity<
  DefaultTypeId,
  Record<string, any>,
  HeadingObjectPropertiesMap
> {}

export function isAnyText(entity: EpObjectEntity): entity is TextObjectEntity {
  return entity.typeId === "def:text" || entity.typeId === "def:heading";
}
// TEXT INLINE OBJECT  -----------------------------------------------------

// USER INLINE OBJECT  -----------------------------------------------------
export type CustomInlinePropertiesMap = Omit<
  SystemPropertiesMap,
  "isContainer"
> & {
  isContainer: Omit<BooleanValuedPropertyEntry<"isContainer">, "value"> & {
    value: false;
  };
};

export interface CustomInlineEntity extends BaseEpObjectEntity<
  UserTypeId,
  Record<string, any>,
  CustomInlinePropertiesMap
> {}

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
export interface CustomContainerEntity extends BaseEpObjectEntity<
  UserTypeId,
  PageContent,
  AllPropertiesMap
> {}
export function isAnyContainer(
  entity: EpObjectEntity,
): entity is SystemContainerEntity | CustomContainerEntity | WorkspaceEntity {
  return entity.props.isContainer.value === true;
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
  | HeadingObjectEntity;

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
