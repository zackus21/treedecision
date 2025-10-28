import type { Branch, Node, Tree } from './tree';

export interface RollbackOptions {
  tolerance?: number;
}

export interface RollbackResult {
  tree: Tree;
  expectedValues: Record<string, number>;
}

const DEFAULT_TOLERANCE = 1e-6;

const cloneBranch = (branch: Branch): Branch => ({
  id: branch.id,
  label: branch.label,
  to: branch.to,
  probability: branch.probability,
  isOptimal: branch.isOptimal ?? false
});

const cloneNodeShallow = (node: Node): Node => ({
  ...node,
  branches: node.branches.map(cloneBranch)
});

export const rollback = (tree: Tree, options: RollbackOptions = {}): RollbackResult => {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const updatedNodes: Record<string, Node> = {};
  const expectedValues: Record<string, number> = {};
  const cache = new Map<string, number>();

  const compute = (nodeId: string): number => {
    if (cache.has(nodeId)) {
      return cache.get(nodeId)!;
    }

    const original = tree.nodes[nodeId];
    if (!original) {
      throw new Error(`Node with id "${nodeId}" not found.`);
    }

    const node = cloneNodeShallow(original);
    let value: number;

    if (node.type === 'leaf' || node.branches.length === 0) {
      value = node.payoff ?? 0;
      node.branches = [];
    } else if (node.type === 'chance') {
      const branchesData = node.branches.map((branch) => {
        const probability = branch.probability ?? 0;
        const childValue = compute(branch.to);
        return { branch, probability, childValue };
      });

      const probabilitySum = branchesData.reduce((sum, data) => sum + data.probability, 0);
      if (Math.abs(probabilitySum - 1) > tolerance) {
        throw new Error(
          `La somme des probabilités du nœud "${node.label}" (${probabilitySum.toFixed(6)}) doit être égale à 1.`
        );
      }

      value = branchesData.reduce((total, data) => total + data.probability * data.childValue, 0);
      node.branches = branchesData.map((data) => ({
        ...data.branch,
        probability: data.probability,
        isOptimal: false
      }));
    } else {
      const branchesData = node.branches.map((branch) => {
        const childValue = compute(branch.to);
        return { branch, childValue };
      });

      let bestValue = Number.NEGATIVE_INFINITY;
      let bestBranchId: string | null = null;

      branchesData.forEach((data) => {
        if (data.childValue > bestValue) {
          bestValue = data.childValue;
          bestBranchId = data.branch.id;
        }
      });

      if (!Number.isFinite(bestValue)) {
        bestValue = node.payoff ?? 0;
        bestBranchId = null;
      }

      value = bestValue;
      node.branches = branchesData.map((data) => ({
        ...data.branch,
        isOptimal: data.branch.id === bestBranchId
      }));
    }

    node.expectedValue = value;
    updatedNodes[nodeId] = node;
    expectedValues[nodeId] = value;
    cache.set(nodeId, value);
    return value;
  };

  Object.keys(tree.nodes).forEach((nodeId) => {
    compute(nodeId);
  });

  return {
    tree: {
      rootId: tree.rootId,
      nodes: updatedNodes
    },
    expectedValues
  };
};
