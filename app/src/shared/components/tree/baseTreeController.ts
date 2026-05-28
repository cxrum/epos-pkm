import { ref, isRef, type Ref } from 'vue'
import type { TreeControllerContract, TreeNode } from './contract'

export function useTreeController(initialNodes: Ref<TreeNode> | TreeNode): TreeControllerContract {
  const rootNode = isRef(initialNodes) ? initialNodes : ref(initialNodes)
  const indexedNodes = ref<Record<number, number[]>>({})

  const selectedId = ref<number | null>(null)
  const expandedIds = ref<Set<number>>(new Set())
  
  const isSelected = (id: number): boolean => {
    return selectedId.value === id
  }

  const isExpanded = (id: number): boolean => {
    return expandedIds.value.has(id)
  }

  const selectNode = (id: number): void => {
    selectedId.value = id
  }

  const toggleExpand = (id: number): void => {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id)
    } else {
      expandedIds.value.add(id)
    }
  }

  const setRootNode = (root: TreeNode) => {
    rootNode.value = root
  }

  const deep_travelsal = (root: TreeNode, discovered: number[], paths: Record<number, number[]>): Record<number, number[]>  => {
    if (!paths[root.id]) {
      paths[root.id] = [];
    }

    for (let index = 0; index < root.children.length; index++) {
      const el = root.children[index];
      if (!discovered.includes(el.id)){
        discovered.push(el.id)
        
        if(paths[root.id]){
          paths[el.id] = paths[root.id].concat(root.id) 
        }else{
          paths[root.id] = []
        }
        
        deep_travelsal(el, discovered, paths)
      }
    }
    return paths
  }

  const index = () => {
    indexedNodes.value = deep_travelsal(rootNode.value, [], {})
  }

  index()

  const find = (id: number, root: TreeNode, discovered: number[]): TreeNode | undefined => {
    if(id === root.id){
      return root
    }

    if (root.children == undefined){
      return undefined
    }

    for (let index = 0; index < root.children.length; index++) {
      const el = root.children[index];
      if (!discovered.includes(el.id)){
        discovered.push(el.id)
        const node = find(id, el, discovered)
        if (node !== undefined) {
          return node
        }
      }
    }
    return undefined
  }

  const getNodeContext = (id: number, path: number[]) => {
    let parentArray: TreeNode[] = rootNode.value.children
    let node: TreeNode | undefined = undefined;

    for (let i = 0; i < path.length; i++) {
      node = parentArray.find(el => el.id === path[i])
      
      if (node) {
        if (!node .children) {
          node.children = []
        }
        parentArray = node.children
      }
    }

    const fNode = parentArray.find(el => el.id === id) 
    return {node: fNode , parentArray: parentArray }
  }

  const moveIn = (id: number, toId: number): void => {
    index()
    const movedNode = getNodeContext(id, indexedNodes.value[id]);
    const destinationNode = getNodeContext(toId, indexedNodes.value[toId]);
    if (!movedNode.node || !destinationNode.node) return;

    const oldIndex = movedNode.parentArray.findIndex(n => n.id === id);
    if (oldIndex > -1) {
      movedNode.parentArray.splice(oldIndex, 1); 
    }

    if (!destinationNode.node.children) {
      destinationNode.node.children = [];
    }
    destinationNode.node.children.push(movedNode.node);

    index()
  }

  const move = (id: number, toId: number, shift: number = 0): void => {
    const movedNode = getNodeContext(id, indexedNodes.value[id]);
    const destinationNode = getNodeContext(toId, indexedNodes.value[toId]);
    if (!movedNode.node || !destinationNode.node) return;

    const oldIndex = movedNode.parentArray.findIndex(n => n.id === id);
    if (oldIndex > -1) {
      movedNode.parentArray.splice(oldIndex, 1); 
    }

    const destinationNodeIndex = destinationNode.parentArray.findIndex(n => n.id === toId);

    if (destinationNodeIndex > -1) {
      destinationNode.parentArray.splice(destinationNodeIndex + shift, 0, movedNode.node);
    }
  }

  const moveAbove = (id: number, toId: number): void => {
    index(); 
    move(id, toId, 0); 
    index(); 
  }

  const moveBelow = (id: number, toId: number): void => {
    index();
    move(id, toId, 1); 
    index();
  }

  const clearSelection = (): void => {
    selectedId.value = -1
  }

  return {
    rootNode,
    selectedId,

    setRootNode,
    isSelected,
    isExpanded,
    selectNode,
    clearSelection,
    toggleExpand,
    
    moveIn,
    moveBelow,
    moveAbove
  }
}