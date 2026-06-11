import type {
  DefaultIcon,
  EmojiIcon,
  LinkIcon,
} from "@/shared/components/icon/type";

export type Icon = DefaultIcon | LinkIcon | EmojiIcon;

export type SystemTypeId =
  | "sys:root"
  | "sys:workspace"
  | "sys:page"
  | "sys:hard-page-link";
export type DefaultTypeId =
  | "def:text"
  | "def:table"
  | "def:latex"
  | "def:code"
  | "def:back-link"
  | "def:arrowed-link";
export type EpTypeId = SystemTypeId | DefaultTypeId | (string & {});
export type UserTypeId = string & { readonly __isUser: unique symbol };
export type EpObjectId = string;

export type _IsContainerPropertyId = "isContainer";
export type SystemPropertyId = _IsContainerPropertyId;
export type EpPropertyId = SystemPropertyId | "title" | (string & {});

export type EpPropertyTypes = "text" | "boolean" | "select" | "number";
// | "object"

export type SettingType = "text" | "boolean" | "select" | "number";

export interface Path {
  id: EpObjectId;
  title: string;
}

export type ObjectPath = Path[];

export interface SettingOption {
  label: string;
  value: string | number;
}

export interface SettingEntry {
  id: string;
  pluginId: string;
  label: string;
  description?: string;
  type: SettingType;
  value: any;
  options?: SettingOption[];
}

export interface SettingsCategory {
  id: string;
  pluginId: string;
  label: string;
  settingEntries: SettingEntry[];
}

export type SystemPageId = "graph" | "aggregator";
export type MetaId = EpObjectId | SystemPageId;

export interface BasePageMeta<TId extends MetaId = MetaId> {
  id: TId;
  title: string;
  icon: Icon;
}

export interface ObjectMeta extends BasePageMeta<EpObjectId> {
  typeId: EpTypeId;
}

export interface SystemPageMeta extends BasePageMeta<SystemPageId> {}

export type PageMeta = ObjectMeta | SystemPageMeta;
