import { ref, isRef, type Ref } from "vue";
import type { TreeControllerContract, TreeNode } from "./contract";
import type { MenuGroup } from "../popUpMenu/type";
import type { TreeMenuGroup } from "./type";

export function useTreeController(
  initialNodes: Ref<TreeNode> | TreeNode,
): TreeControllerContract<string> {
  const rootNode = isRef(initialNodes) ? initialNodes : ref(initialNodes);
  const indexedNodes = ref<Record<string, string[]>>({});

  const selectedId = ref<string | null>(null);
  const expandedIds = ref<Set<string>>(new Set());

  const renameCallBack = ref();
  const updateStructureCallBack = ref();
  const menuItemsGroup = ref();

  const moveCallBack = ref();

  const isSelected = (id: string): boolean => {
    return selectedId.value === id;
  };

  const isExpanded = (id: string): boolean => {
    return expandedIds.value.has(id);
  };

  const selectNode = (id: string): void => {
    selectedId.value = id;
  };

  const toggleExpand = (id: string): void => {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id);
    } else {
      expandedIds.value.add(id);
    }
  };

  const setRootNode = (root: TreeNode) => {
    rootNode.value = root;
  };

  const deep_traversal = (
    root: TreeNode,
    discovered: string[],
    paths: Record<string, string[]>,
  ): Record<string, string[]> => {
    if (!paths[root.id]) {
      paths[root.id] = [];
    }

    for (let index = 0; index < root.children.length; index++) {
      const el = root.children[index];
      if (!discovered.includes(el.id)) {
        discovered.push(el.id);

        if (paths[root.id]) {
          paths[el.id] = paths[root.id].concat(root.id);
        } else {
          paths[root.id] = [];
        }

        deep_traversal(el, discovered, paths);
      }
    }
    return paths;
  };

  const index = () => {
    indexedNodes.value = deep_traversal(rootNode.value, [], {});
  };

  index();

  const find = (
    id: string,
    root: TreeNode,
    discovered: string[],
  ): TreeNode | undefined => {
    if (id === root.id) {
      return root;
    }

    if (root.children == undefined) {
      return undefined;
    }

    for (let index = 0; index < root.children.length; index++) {
      const el = root.children[index];
      if (!discovered.includes(el.id)) {
        discovered.push(el.id);
        const node = find(id, el, discovered);
        if (node !== undefined) {
          return node;
        }
      }
    }
    return undefined;
  };

  const getNodeContext = (id: string, path: string[]) => {
    let parentArray: TreeNode[] = rootNode.value.children;
    let node: TreeNode | undefined = undefined;

    for (let i = 0; i < path.length; i++) {
      node = parentArray.find((el) => el.id === path[i]);

      if (node) {
        if (!node.children) {
          node.children = [];
        }
        parentArray = node.children;
      }
    }

    const fNode = parentArray.find((el) => el.id === id);
    return { node: fNode, parentArray: parentArray, parent: node };
  };

  const move = (id: string, toId: string, shift: number = 0): void => {
    const movedNode = getNodeContext(id, indexedNodes.value[id]);
    const destinationNode = getNodeContext(toId, indexedNodes.value[toId]);
    if (!movedNode.node || !destinationNode.node) return;

    const oldIndex = movedNode.parentArray.findIndex((n) => n.id === id);
    if (oldIndex > -1) {
      movedNode.parentArray.splice(oldIndex, 1);
    }

    const destinationNodeIndex = destinationNode.parentArray.findIndex(
      (n) => n.id === toId,
    );

    if (destinationNodeIndex > -1) {
      destinationNode.parentArray.splice(
        destinationNodeIndex + shift,
        0,
        movedNode.node,
      );
    }
  };

  const moveIn = (id: string, toId: string): void => {
    index();
    const movedNode = getNodeContext(id, indexedNodes.value[id]);
    const destinationNode = getNodeContext(toId, indexedNodes.value[toId]);
    if (!movedNode.node || !destinationNode.node) return;

    const oldIndex = movedNode.parentArray.findIndex((n) => n.id === id);
    if (oldIndex > -1) {
      movedNode.parentArray.splice(oldIndex, 1);
    }

    if (!destinationNode.node.children) {
      destinationNode.node.children = [];
    }
    destinationNode.node.children.push(movedNode.node);
    console.log(id, toId, movedNode.parent?.id);
    moveCallBack.value(id, toId, movedNode.parent?.id, "inside");
    index();
  };

  const moveAbove = (id: string, toId: string): void => {
    index();
    move(id, toId, 0);
    index();
  };

  const moveBelow = (id: string, toId: string): void => {
    index();
    move(id, toId, 1);
    index();
  };

  const clearSelection = (): void => {
    selectedId.value = "";
  };

  const setRenameCallBack = (func: (id: string, newTitle: string) => void) => {
    renameCallBack.value = func;
  };

  const setMoveCallBack = (
    func: (
      id: string,
      toId: string,
      oldParentId: string,
      type: "above" | "below" | "in",
    ) => void,
  ) => {
    moveCallBack.value = func;
  };

  const setUpdateStructureCallBack = (func: (root: TreeNode) => void) => {
    updateStructureCallBack.value = func;
  };

  const setMenuItems = (items: TreeMenuGroup) => {
    menuItemsGroup.value = items;
  };

  return {
    rootNode,
    selectedId,
    renameCallBack,
    updateStructureCallBack,
    menuItemsGroup,

    setMenuItems,
    setRootNode,
    isSelected,
    isExpanded,
    selectNode,
    clearSelection,
    toggleExpand,

    moveIn,
    moveBelow,
    moveAbove,

    setMoveCallBack,
    setRenameCallBack,
    setUpdateStructureCallBack,
  };
}
