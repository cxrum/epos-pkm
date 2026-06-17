import type { Component } from "vue";

export type MenuItemType = "button" | "divider";

export interface MenuItem<T = any> {
  type: MenuItemType;
  label?: string;
  icon?: Component | string | null;
  action?: (context: T) => void;
  disabled?: boolean;
}

export interface MenuGroup<T = any> {
  title?: string;
  items: MenuItem<T>[];
}
