import { defineAsyncComponent, type Component } from "vue";

export interface BaseIcon {
  type: string;
}

export interface BaseDefaultIcon extends BaseIcon {
  type: "default";
  name: string;
}

export interface ErrorIcon extends BaseDefaultIcon {
  name: "error";
}

export interface TableIcon extends BaseDefaultIcon {
  name: "table";
}

export interface PageIcon extends BaseDefaultIcon {
  name: "page";
}

export interface ObjectIcon extends BaseDefaultIcon {
  name: "object";
}

export interface TypeIcon extends BaseDefaultIcon {
  name: "type";
}

export interface TypeDictionaryIcon extends BaseDefaultIcon {
  name: "typeDictionary";
}

export interface LockIcon extends BaseDefaultIcon {
  name: "lock";
}

export type DefaultIcon =
  | TableIcon
  | TypeDictionaryIcon
  | PageIcon
  | ObjectIcon
  | ErrorIcon
  | LockIcon
  | TypeIcon;

export interface LinkIcon extends BaseIcon {
  type: "link";
  link: string;
}

export interface EmojiIcon extends BaseIcon {
  type: "emoji";
  emoji: string;
}

export const iconMap: Record<string, Component> = {
  document: defineAsyncComponent(
    () => import("@/assets/icons/DocumentIcon.vue"),
  ),
  object: defineAsyncComponent(() => import("@/assets/icons/TypeIcon.vue")),
  table: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
  error: defineAsyncComponent(() => import("@/assets/icons/Table.vue")),
  typeDictionary: defineAsyncComponent(
    () => import("@/assets/icons/TypeDictionary.vue"),
  ),
  lock: defineAsyncComponent(() => import("@/assets/icons/Lock.vue")),
};
