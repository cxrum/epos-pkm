import type { EpObjectId, EpTypeId, Icon } from "@/core/types";

export type HardPageLink = string; // Hardcoded page ID

export interface RawEpObject {
  id: EpObjectId;
  typeId: EpTypeId;
  content: Record<string, any>;
}

export interface RawContainerObject {
  id: EpObjectId;
  typeId: EpTypeId;
  title: string;
  rawData: Record<EpObjectId, RawEpObject>;
}
