import type {
  DefaultIcon,
  EmojiIcon,
  LinkIcon,
} from "@/shared/components/icon/type";

export type Icon = DefaultIcon | LinkIcon | EmojiIcon;

export type SystemTypeId =
  | "sys:root"
  | "sys:workspace"
  | "sys:container"
  | "sys:hard-page-link";
export type DefaultTypeId =
  | "def:text"
  | "def:heading"
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

export type SystemPageId = "graph" | "aggregator" | "type-graph";

export type MetaId = EpObjectId | SystemPageId;

type _Kind = "system" | "page" | "type";

export interface BasePageMeta<
  TId extends MetaId = MetaId,
  TKind extends _Kind = "system",
> {
  id: TId;
  title: string;
  icon: Icon;
  kind: TKind;
}

export interface ObjectMeta extends BasePageMeta<EpObjectId, "page"> {}
export interface TypeMeta extends BasePageMeta<EpObjectId, "type"> {}
export interface SystemPageMeta extends BasePageMeta<SystemPageId, "system"> {}

export type PageMeta = TypeMeta | ObjectMeta | SystemPageMeta;

export const TypeEditorPageMeta: SystemPageMeta = {
  id: "type-graph",
  title: "Type Graph",
  icon: {
    type: "emoji",
    emoji: "T",
  },
  kind: "system",
};

export function isSystemPageMeta(meta: PageMeta): meta is SystemPageMeta {
  return meta.kind === "system";
}
export function isTypePageMeta(meta: PageMeta): meta is TypeMeta {
  return meta.kind === "type";
}
export function isObjectPageMeta(meta: PageMeta): meta is ObjectMeta {
  return meta.kind === "page";
}
