import type { EpObjectId, Icon, MetaId } from "@/core/types";
import type { Ref } from "vue";
import type { MenuGroup } from "../popUpMenu/type";

export interface TreeNode {
  id: EpObjectId;
  title: string;
  icon?: Icon;
  children: TreeNode[];
}

export interface TreeControllerContract<TId extends MetaId> {
  rootNode: Ref<TreeNode>;
  selectedId: Ref<TId | null>;
  isDraggable: Ref<boolean>;

  renameCallBack: Ref<Function | undefined>;
  updateStructureCallBack: Ref<Function | undefined>;
  menuItemsGroup: Ref<MenuGroup | undefined>;

  isSelected(id: TId): boolean;
  isExpanded(id: TId): boolean;
  selectNode(id: TId): void;
  setRootNode(root: TreeNode): void;
  clearSelection(): void;
  toggleExpand(id: TId): void;

  setIsDraggable(value: boolean): void;

  moveIn(id: TId, toId: TId): void;
  moveAbove(id: TId, toId: TId): void;
  moveBelow(id: TId, toId: TId): void;

  setMenuItems(items: MenuGroup[]): void;
  setMoveCallBack(
    func: (
      id: string,
      toId: string,
      oldParentId: string,
      type: "above" | "below" | "in",
    ) => void,
  ): void;
  setRenameCallBack(func: (id: TId, newTitle: string) => void): void;
  setUpdateStructureCallBack(func: (root: TreeNode) => void): void;
}
