import type {
  DefaultIcon,
  EmojiIcon,
  LinkIcon,
} from "@/shared/components/icon/type";

export type Icon = DefaultIcon | LinkIcon | EmojiIcon;

export type SystemTypeId = "sys:root" | "sys:page";
export type DefaultTypeId = "def:text" | "def:latex" | "def:code";
export type EpTypeId = SystemTypeId | DefaultTypeId | (string & {});
export type UserTypeId = string & { readonly __isUser: unique symbol };
export type EpObjectId = number;

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

export type ObjectFilterOptions = {
  types?: EpTypeId[] | EpTypeId;
  descendantTypes?: boolean;
  text?: string;
};
