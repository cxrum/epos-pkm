import type { EpObjectType } from "@/core/types";
import type { Ref } from "vue";

export interface TreeNode{
  id: number,
  title: string,
  type?: EpObjectType,
  children: TreeNode[]
}

export interface TreeControllerContract {
  rootNode: Ref<TreeNode>
  selectedId: Ref<number | null>
  
  isSelected(id: number): boolean
  isExpanded(id: number): boolean
  selectNode(id: number): void
  setRootNode(root: TreeNode): void
  clearSelection(): void
  toggleExpand(id: number): void

  moveIn(id: number, toId: number): void
  moveAbove(id: number, toId: number): void
  moveBelow(id: number, toId: number): void
}