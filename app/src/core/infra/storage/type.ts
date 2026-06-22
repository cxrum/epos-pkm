import type { _PropertyKind, _TypeKind } from "@/core/domain/type";
import type {
  EpObjectId,
  EpPropertyId,
  EpPropertyTypes,
  EpTypeId,
  Icon,
} from "@/core/types";

export interface RawBaseEpObject<TContent> {
  id: EpObjectId;
  typeId: EpTypeId;
  properties: Record<string, any>;
  content: TContent;
}

export interface RawEpObject extends RawBaseEpObject<Record<EpObjectId, any>> {}
export interface RawEpMountedContainer extends RawBaseEpObject<{
  toId: EpObjectId;
}> {}
export interface RawContainerObject extends RawBaseEpObject<
  Record<EpObjectId, RawEpObject>
> {
  title: string;
  order: EpObjectId[];
}

export type RawPropertiesSchemeEntry = {
  id: EpPropertyId;
  title: string;
  type: EpPropertyTypes;
  kind: _PropertyKind;
  isChangeable: boolean;
};

export type RawPropertiesScheme = {
  order: EpTypeId[];
  props: Record<string, RawPropertiesSchemeEntry>;
};

export interface RawEpType {
  id: EpTypeId;
  kind: _TypeKind;
  icon?: Icon;
  title: string;
  propertiesScheme?: RawPropertiesScheme;
}

export interface RawEptTypeHierarchyNode {
  id: EpTypeId;
  type: RawEpType;
  children: RawEptTypeHierarchyNode[];
}

export type RawObjectFilterOptions = {
  types?: EpTypeId[] | EpTypeId;
  text?: string;
};

export type AllRawEpObject =
  | RawEpMountedContainer
  | RawEpObject
  | RawContainerObject;

export const isRawMountedContainer = (
  obj: any,
): obj is RawEpMountedContainer => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "content" in obj &&
    "toId" in obj.content
  );
};

export const isRawContainer = (obj: any): obj is RawContainerObject => {
  return obj !== null && typeof obj === "object" && "title" in obj;
};
