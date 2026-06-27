import type {
  AnyValidPropertyEntry,
  BasePropertySchemeEntry,
} from "../domain/type";
import type { EpPropertyId, EpPropertyType, EpTypeId, Icon } from "../types";

interface _BasePropertiesScheme<TProps> {
  inheritance: Map<EpPropertyId, EpTypeId>;
  order: EpPropertyId[];
  props: TProps;
}

export interface AncestorType {
  id: EpTypeId;
  title: string;
  icon?: Icon;
}

export interface ValuedPropertyEntry {
  propertyScheme: PropertyEntry;
  value?: AnyValidPropertyEntry;
}

export interface PropertyEntry {
  id: string;
  parentType?: AncestorType;
  title: string;
  icon: Icon;
  type: EpPropertyType;
  isChangeable: boolean;
  isSystem: boolean;
}

export interface PropertiesScheme extends _BasePropertiesScheme<
  Map<EpPropertyId, PropertyEntry>
> {}
export interface ValuedPropertiesScheme extends _BasePropertiesScheme<
  Map<EpPropertyId, ValuedPropertyEntry>
> {}
