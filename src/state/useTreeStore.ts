import { create } from 'zustand';

import { rollback } from '../lib/rollback';
import {
  type Branch,
  type CloneSubtreeOptions,
  type Node,
  type Tree,
  addBranch,
  addNode,
  cloneSubtree,
  deleteSubtree
} from '../lib/tree';
import { chargerArbre, sauvegarderArbre } from '../lib/storage';

// Arbre vide prêt à recevoir un premier nœud.
const creerArbreInitial = (): Tree => ({
  rootId: null,
  nodes: {}
});

// Tentative de restauration depuis le navigateur ; repli sur un arbre vide en cas d'échec.
const chargerEtatInitial = (): Tree => {
  const fromStorage = chargerArbre();
  return fromStorage ?? creerArbreInitial();
};

export interface TreeStoreState {
  tree: Tree;
  valeurs: Record<string, number>;
  noeudSelectionne: string | null;
  erreurRollback: string | null;
  selectionner: (id: string | null) => void;
  ajouterNoeud: (node: Node) => void;
  ajouterBranche: (parentId: string, branch: Branch) => void;
  supprimerSousArbre: (nodeId: string) => void;
  clonerSousArbre: (nodeId: string, options?: CloneSubtreeOptions) => string;
  chargerDepuisImport: (tree: Tree) => void;
  reinitialiser: () => void;
  runRollback: () => void;
}

/**
 * Store Zustand centralisant l'état métier de l'arbre de décision.
 * Chaque action met automatiquement à jour la persistance locale.
 */
export const useTreeStore = create<TreeStoreState>((set, get) => ({
  tree: chargerEtatInitial(),
  valeurs: {},
  noeudSelectionne: null,
  erreurRollback: null,

  selectionner: (id) => set({ noeudSelectionne: id }),

  ajouterNoeud: (node) => {
    set((state) => {
      const nextTree = addNode(state.tree, node);
      sauvegarderArbre(nextTree);
      return {
        tree: nextTree,
        valeurs: {},
        erreurRollback: null,
        noeudSelectionne: node.id
      };
    });
  },

  ajouterBranche: (parentId, branch) => {
    set((state) => {
      const nextTree = addBranch(state.tree, parentId, branch);
      sauvegarderArbre(nextTree);
      return {
        tree: nextTree,
        valeurs: {},
        erreurRollback: null
      };
    });
  },

  supprimerSousArbre: (nodeId) => {
    set((state) => {
      const nextTree = deleteSubtree(state.tree, nodeId);
      sauvegarderArbre(nextTree);
      const selectionId = state.noeudSelectionne;
      const selectionExiste = selectionId !== null && Boolean(nextTree.nodes[selectionId]);
      return {
        tree: nextTree,
        valeurs: {},
        erreurRollback: null,
        noeudSelectionne: selectionExiste ? selectionId : nextTree.rootId
      };
    });
  },

  clonerSousArbre: (nodeId, options) => {
    let nouveauNoeud = nodeId;
    set((state) => {
      const resultat = cloneSubtree(state.tree, nodeId, options);
      nouveauNoeud = resultat.rootId;
      sauvegarderArbre(resultat.tree);
      return {
        tree: resultat.tree,
        valeurs: {},
        erreurRollback: null,
        noeudSelectionne: resultat.rootId
      };
    });
    return nouveauNoeud;
  },

  chargerDepuisImport: (tree) => {
    sauvegarderArbre(tree);
    set({
      tree,
      valeurs: {},
      erreurRollback: null,
      noeudSelectionne: tree.rootId
    });
  },

  reinitialiser: () => {
    const tree = creerArbreInitial();
    sauvegarderArbre(tree);
    set({
      tree,
      valeurs: {},
      erreurRollback: null,
      noeudSelectionne: null
    });
  },

  runRollback: () => {
    const { tree } = get();
    if (!tree.rootId) {
      set({ valeurs: {}, erreurRollback: null });
      return;
    }

    try {
      const resultat = rollback(tree);
      sauvegarderArbre(resultat.tree);
      set({
        tree: resultat.tree,
        valeurs: resultat.expectedValues,
        erreurRollback: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue lors du rollback.';
      // On conserve l'arbre courant mais on surface le message pour l'interface.
      set({ erreurRollback: message, valeurs: {} });
    }
  }
}));
