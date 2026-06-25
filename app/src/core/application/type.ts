import type { BasePropertySchemeEntry } from "../domain/type";
import type { EpPropertyId, EpTypeId } from "../types";

export interface PropertiesScheme {
  inheritance: Map<EpPropertyId, EpTypeId>;
  order: EpPropertyId[];
  props: Record<string, BasePropertySchemeEntry>;
}
