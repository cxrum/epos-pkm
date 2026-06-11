import type { EpTypeEntity } from "@/core/domain/type";
import type { EpObjectId, MetaId } from "@/core/types";
import type { Ref } from "vue";

export interface TreeNode {
  id: EpObjectId;
  title: string;
  type?: EpTypeEntity;
  children: TreeNode[];
}

export interface TreeControllerContract<TId extends MetaId> {
  rootNode: Ref<TreeNode>;
  selectedId: Ref<TId | null>;

  isSelected(id: TId): boolean;
  isExpanded(id: TId): boolean;
  selectNode(id: TId): void;
  setRootNode(root: TreeNode): void;
  clearSelection(): void;
  toggleExpand(id: TId): void;

  moveIn(id: TId, toId: TId): void;
  moveAbove(id: TId, toId: TId): void;
  moveBelow(id: TId, toId: TId): void;
}
