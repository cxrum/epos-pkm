import type { _TypeKind } from "@/core/domain/type";
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
  descendantTypes?: boolean;
  text?: string;
};

export type AllRawEpObject = RawEpObject | RawContainerObject;
