import type { EpObjectId, EpTypeId, Icon } from "@/core/types";

export interface RawEpObject {
  id: EpObjectId;
  typeId: EpTypeId;
  properties: Record<string, any>;
  content: Record<string, any>;
}

export interface RawContainerObject {
  id: EpObjectId;
  typeId: EpTypeId;
  title: string;
  order: EpObjectId[];
  properties: Record<string, any>;
  rawData: Record<EpObjectId, RawEpObject>;
}

export type RawProperties = Record<string, any>;

export interface RawEpType {
  id: EpTypeId;
  kind: string;
  icon?: Icon;
  title: string;
  properties: RawProperties;
}
