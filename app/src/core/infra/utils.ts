export const deepTraversal = <T, K extends PropertyKey>(
  root: T,
  idKey: keyof T,
  childrenKey: keyof T,
  discovered: Set<K> = new Set<K>(),
  paths: Record<K, K[]> = {} as Record<K, K[]>,
): Record<K, K[]> => {
  const rootId = root[idKey] as unknown as K;

  if (!paths[rootId]) {
    paths[rootId] = [];
  }

  const children = root[childrenKey] as unknown as T[] | undefined;

  if (children) {
    for (let index = 0; index < children.length; index++) {
      const el = children[index];
      const elId = el[idKey] as unknown as K;

      if (!discovered.has(elId)) {
        discovered.add(elId);

        paths[elId] = paths[rootId].concat(rootId);

        deepTraversal(el, idKey, childrenKey, discovered, paths);
      }
    }
  }

  return paths;
};

export const findNode = <T, K extends PropertyKey>(
  targetId: K,
  root: T,
  idKey: keyof T,
  childrenKey: keyof T,
  discovered: Set<K> = new Set<K>(),
): T | undefined => {
  const rootId = root[idKey] as unknown as K;

  if (targetId === rootId) {
    return root;
  }

  const children = root[childrenKey] as unknown as T[] | undefined;

  if (!children) {
    return undefined;
  }

  for (let index = 0; index < children.length; index++) {
    const el = children[index];
    const elId = el[idKey] as unknown as K;

    if (!discovered.has(elId)) {
      discovered.add(elId);

      const node = findNode(targetId, el, idKey, childrenKey, discovered);

      if (node !== undefined) {
        return node;
      }
    }
  }

  return undefined;
};

export const flattenTree = <T>(root: T, childrenKey: keyof T): T[] => {
  const result: T[] = [];

  const traverse = (currentNodes: T[]) => {
    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i];
      result.push(node);

      const children = node[childrenKey] as T[] | undefined;

      if (children && Array.isArray(children) && children.length > 0) {
        traverse(children);
      }
    }
  };

  traverse(root[childrenKey] as T[]);

  return result;
};

export type Edge<K> = { source: K; target: K };

export const extractTreeEdges = <T, K extends PropertyKey>(
  root: T,
  idKey: keyof T,
  childrenKey: keyof T,
): Edge<K>[] => {
  const edges: Edge<K>[] = [];

  const traverse = (currentNodes: T[], parentId?: K) => {
    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i];
      const currentId = node[idKey] as unknown as K;

      if (parentId !== undefined) {
        edges.push({ source: parentId, target: currentId });
      }

      const children = node[childrenKey] as T[] | undefined;

      if (children && Array.isArray(children) && children.length > 0) {
        traverse(children, currentId);
      }
    }
  };

  traverse(root[childrenKey] as T[]);

  return edges;
};
