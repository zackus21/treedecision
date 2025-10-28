import { describe, expect, it } from 'vitest';
import { rollback } from '../rollback';
import type { Tree } from '../tree';

describe('rollback', () => {
  const buildTree = (): Tree => ({
    rootId: 'root',
    nodes: {
      root: {
        id: 'root',
        type: 'decision',
        label: 'Décision',
        branches: [
          { id: 'b1', label: 'Vers chance', to: 'chance' },
          { id: 'b2', label: 'Vers feuille 3', to: 'leaf3' }
        ]
      },
      chance: {
        id: 'chance',
        type: 'chance',
        label: 'Aléatoire',
        branches: [
          { id: 'c1', label: 'Vers feuille 1', to: 'leaf1', probability: 0.25 },
          { id: 'c2', label: 'Vers feuille 2', to: 'leaf2', probability: 0.75 }
        ]
      },
      leaf1: {
        id: 'leaf1',
        type: 'leaf',
        label: 'Feuille 1',
        payoff: 100,
        branches: []
      },
      leaf2: {
        id: 'leaf2',
        type: 'leaf',
        label: 'Feuille 2',
        payoff: 20,
        branches: []
      },
      leaf3: {
        id: 'leaf3',
        type: 'leaf',
        label: 'Feuille 3',
        payoff: 30,
        branches: []
      }
    }
  });

  it('calcule les valeurs attendues et la meilleure branche', () => {
    const original = buildTree();
    const { tree, expectedValues } = rollback(original);

    expect(expectedValues.leaf1).toBe(100);
    expect(expectedValues.leaf2).toBe(20);
    expect(expectedValues.leaf3).toBe(30);

    const chanceValue = 0.25 * 100 + 0.75 * 20;
    expect(expectedValues.chance).toBeCloseTo(chanceValue, 10);
    expect(expectedValues.root).toBeCloseTo(Math.max(chanceValue, 30), 10);

    const root = tree.nodes.root;
    const bestBranch = root.branches.find((branch) => branch.isOptimal);
    expect(bestBranch?.to).toBe('chance');
    const otherBranch = root.branches.find((branch) => branch.id === 'b2');
    expect(otherBranch?.isOptimal).toBe(false);
  });

  it('valide que la somme des probabilités vaut 1 pour un nœud chance', () => {
    const invalidTree: Tree = {
      rootId: 'chance',
      nodes: {
        chance: {
          id: 'chance',
          type: 'chance',
          label: 'Chance invalide',
          branches: [
            { id: 'c1', label: 'A', to: 'leafA', probability: 0.2 },
            { id: 'c2', label: 'B', to: 'leafB', probability: 0.2 }
          ]
        },
        leafA: {
          id: 'leafA',
          type: 'leaf',
          label: 'Feuille A',
          payoff: 10,
          branches: []
        },
        leafB: {
          id: 'leafB',
          type: 'leaf',
          label: 'Feuille B',
          payoff: 5,
          branches: []
        }
      }
    };

    expect(() => rollback(invalidTree)).toThrow(/probabilités/);
  });

  it('retourne la valeur de la feuille lorsque le nœud est isolé', () => {
    const tree: Tree = {
      rootId: 'leaf',
      nodes: {
        leaf: {
          id: 'leaf',
          type: 'leaf',
          label: 'Gain',
          payoff: 42,
          branches: []
        }
      }
    };

    const { expectedValues, tree: result } = rollback(tree);
    expect(expectedValues.leaf).toBe(42);
    expect(result.nodes.leaf.expectedValue).toBe(42);
    expect(result.nodes.leaf.branches).toHaveLength(0);
  });
});
