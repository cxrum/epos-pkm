import type { MenuGroup } from "../popUpMenu/type";

export interface TreeComponentContext {
  id: string;
  title: string;
}

export type TreeMenuGroup = MenuGroup<TreeComponentContext>[];
