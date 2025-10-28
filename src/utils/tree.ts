import type { TreeNode, TreeState } from '../types';
import { genererId } from './id';

export const LOCAL_STORAGE_KEY = 'treedecision-state-v1';

export const creerNoeud = (
  partial: Partial<TreeNode> & Pick<TreeNode, 'type' | 'titre'>
): TreeNode => {
  const id = genererId();
  return {
    id,
    titre: partial.titre,
    type: partial.type,
    parentId: partial.parentId ?? null,
    description: partial.description,
    children: partial.children ?? [],
    valeur: partial.valeur,
    probabilite: partial.probabilite
  };
};

export const valeurAttendue = (
  nodeId: string,
  state: TreeState,
  cache: Map<string, number> = new Map()
): number => {
  if (cache.has(nodeId)) {
    return cache.get(nodeId)!;
  }

  const node = state.nodes[nodeId];
  if (!node) {
    return 0;
  }

  let result = 0;
  if (node.type === 'feuille' || node.children.length === 0) {
    result = node.valeur ?? 0;
  } else if (node.type === 'aleatoire') {
    result = node.children.reduce((total, childId) => {
      const child = state.nodes[childId];
      const proba = child?.probabilite ?? 0;
      const childValue = valeurAttendue(childId, state, cache);
      return total + proba * childValue;
    }, 0);
  } else {
    result = Math.max(
      ...node.children.map((childId) => valeurAttendue(childId, state, cache)),
      node.valeur ?? Number.NEGATIVE_INFINITY
    );
    if (!Number.isFinite(result)) {
      result = 0;
    }
  }

  cache.set(nodeId, result);
  return result;
};

export const probabiliteTotale = (nodeId: string, state: TreeState): number => {
  const node = state.nodes[nodeId];
  if (!node) {
    return 0;
  }
  return node.children.reduce((total, childId) => {
    const child = state.nodes[childId];
    return total + (child?.probabilite ?? 0);
  }, 0);
};

export const chargerDepuisLocalStorage = (): TreeState | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as TreeState;
    return parsed;
  } catch (error) {
    console.error('Impossible de lire l\'état sauvegardé', error);
    return null;
  }
};

export const sauvegarderDansLocalStorage = (state: TreeState) => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
};

export const creerEtatInitial = (): TreeState => {
  const racineId = genererId();
  return {
    nodes: {
      [racineId]: {
        id: racineId,
        type: 'decision',
        titre: 'Décision initiale',
        description: 'Point de départ',
        parentId: null,
        children: [],
        valeur: undefined,
        probabilite: undefined
      }
    },
    rootId: racineId,
    derniereModification: new Date().toISOString()
  };
};

export const serialiserEtat = (state: TreeState): string => JSON.stringify(state, null, 2);

export const desserialiserEtat = (texte: string): TreeState => {
  const parsed = JSON.parse(texte) as TreeState;
  if (!parsed.rootId || !parsed.nodes[parsed.rootId]) {
    throw new Error('L\'arbre importé est invalide.');
  }
  return parsed;
};
