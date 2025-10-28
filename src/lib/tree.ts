export type NodeType = 'decision' | 'chance' | 'leaf';

export interface Branch {
  id: string;
  label: string;
  to: string;
  probability?: number;
  isOptimal?: boolean;
}

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  payoff?: number;
  expectedValue?: number;
  branches: Branch[];
}

export interface Tree {
  rootId: string | null;
  nodes: Record<string, Node>;
}

const generateId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
};

export const addNode = (tree: Tree, node: Node): Tree => {
  if (tree.nodes[node.id]) {
    throw new Error(`Node with id "${node.id}" already exists.`);
  }

  const nextNodes = {
    ...tree.nodes,
    [node.id]: {
      ...node,
      branches: node.branches.map((branch) => ({ ...branch }))
    }
  };

  const rootId = tree.rootId ?? node.id;

  return {
    rootId,
    nodes: nextNodes
  };
};

export const addBranch = (tree: Tree, parentId: string, branch: Branch): Tree => {
  const parent = tree.nodes[parentId];
  if (!parent) {
    throw new Error(`Parent node with id "${parentId}" not found.`);
  }

  if (!tree.nodes[branch.to]) {
    throw new Error(`Target node with id "${branch.to}" not found.`);
  }

  if (parent.type === 'leaf') {
    throw new Error('Cannot add a branch to a leaf node.');
  }

  if (parent.branches.some((existing) => existing.id === branch.id)) {
    throw new Error(`Branch with id "${branch.id}" already exists on node "${parentId}".`);
  }

  const nextParent: Node = {
    ...parent,
    branches: [...parent.branches, { ...branch }]
  };

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [parentId]: nextParent
    }
  };
};

export const deleteSubtree = (tree: Tree, nodeId: string): Tree => {
  if (!tree.nodes[nodeId]) {
    return tree;
  }

  const toDelete = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (toDelete.has(currentId)) {
      continue;
    }
    toDelete.add(currentId);
    const node = tree.nodes[currentId];
    node.branches.forEach((branch) => {
      if (!toDelete.has(branch.to)) {
        stack.push(branch.to);
      }
    });
  }

  const nextNodes: Record<string, Node> = {};
  for (const [id, node] of Object.entries(tree.nodes)) {
    if (toDelete.has(id)) {
      continue;
    }

    const filteredBranches = node.branches
      .filter((branch) => !toDelete.has(branch.to))
      .map((branch) => ({ ...branch }));

    nextNodes[id] = {
      ...node,
      branches: filteredBranches
    };
  }

  const rootId = tree.rootId && toDelete.has(tree.rootId) ? null : tree.rootId;

  return {
    rootId,
    nodes: nextNodes
  };
};

export interface CloneSubtreeOptions {
  targetParentId?: string;
  branchLabel?: string;
  probability?: number;
}

export interface CloneSubtreeResult {
  tree: Tree;
  rootId: string;
}

export const cloneSubtree = (
  tree: Tree,
  nodeId: string,
  options: CloneSubtreeOptions = {}
): CloneSubtreeResult => {
  if (!tree.nodes[nodeId]) {
    throw new Error(`Node with id "${nodeId}" not found.`);
  }

  const branchId = () => generateId('branch');
  const nodeIdGenerator = () => generateId('node');

  const clonedNodes: Record<string, Node> = {};

  const cloneNode = (id: string): string => {
    const original = tree.nodes[id];
    if (!original) {
      throw new Error(`Node with id "${id}" not found.`);
    }

    const newId = nodeIdGenerator();

    const clonedBranches: Branch[] = original.branches.map((branch) => {
      const clonedChildId = cloneNode(branch.to);
      return {
        ...branch,
        id: branchId(),
        to: clonedChildId,
        isOptimal: false
      };
    });

    const clonedNode: Node = {
      ...original,
      id: newId,
      branches: clonedBranches,
      expectedValue: undefined
    };

    clonedNodes[newId] = clonedNode;
    return newId;
  };

  const clonedRootId = cloneNode(nodeId);

  const mergedNodes: Record<string, Node> = {
    ...tree.nodes,
    ...clonedNodes
  };

  let resultTree: Tree = {
    rootId: tree.rootId,
    nodes: mergedNodes
  };

  if (options.targetParentId) {
    const parent = mergedNodes[options.targetParentId];
    if (!parent) {
      throw new Error(`Parent node with id "${options.targetParentId}" not found.`);
    }
    if (parent.type === 'leaf') {
      throw new Error('Cannot attach a cloned subtree to a leaf node.');
    }

    const newBranch: Branch = {
      id: branchId(),
      label: options.branchLabel ?? mergedNodes[clonedRootId].label,
      to: clonedRootId,
      probability: options.probability,
      isOptimal: false
    };

    resultTree = addBranch(resultTree, options.targetParentId, newBranch);
  }

  return {
    tree: resultTree,
    rootId: clonedRootId
  };
};
