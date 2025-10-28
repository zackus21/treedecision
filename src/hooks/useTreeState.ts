import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeType, TreeNode, TreeState } from '../types';
import {
  chargerDepuisLocalStorage,
  creerEtatInitial,
  desserialiserEtat,
  probabiliteTotale,
  sauvegarderDansLocalStorage,
  serialiserEtat,
  valeurAttendue
} from '../utils/tree';
import { genererId } from '../utils/id';

export interface UseTreeState {
  state: TreeState;
  mettreAJourNoeud: (id: string, patch: Partial<TreeNode>) => void;
  ajouterEnfant: (parentId: string, type: NodeType) => void;
  supprimerNoeud: (id: string) => void;
  reinitialiser: () => void;
  valeurCourante: number;
  exporter: () => string;
  importer: (texte: string) => void;
}

const mettreAJourHorodatage = (state: TreeState): TreeState => ({
  ...state,
  derniereModification: new Date().toISOString()
});

const ajouterLienParent = (state: TreeState, parentId: string, childId: string): TreeState => {
  const parent = state.nodes[parentId];
  if (!parent) {
    return state;
  }
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [parentId]: {
        ...parent,
        children: [...parent.children, childId]
      }
    }
  };
};

export const useTreeState = (): UseTreeState => {
  const [state, setState] = useState<TreeState>(() => {
    const restored = chargerDepuisLocalStorage();
    return restored ?? creerEtatInitial();
  });

  useEffect(() => {
    sauvegarderDansLocalStorage(state);
  }, [state]);

  const mettreAJourNoeud = useCallback((id: string, patch: Partial<TreeNode>) => {
    setState((current) => {
      const node = current.nodes[id];
      if (!node) {
        return current;
      }
      return mettreAJourHorodatage({
        ...current,
        nodes: {
          ...current.nodes,
          [id]: {
            ...node,
            ...patch,
            probabilite: patch.probabilite ?? node.probabilite,
            valeur: patch.valeur ?? node.valeur
          }
        }
      });
    });
  }, []);

  const ajouterEnfant = useCallback((parentId: string, type: NodeType) => {
    setState((current) => {
      const parent = current.nodes[parentId];
      if (!parent) {
        return current;
      }
      const nouveau: TreeNode = {
        id: genererId(),
        type,
        titre: type === 'decision' ? 'Nouvelle décision' : type === 'aleatoire' ? 'Événement aléatoire' : 'Nouvelle feuille',
        parentId,
        description: '',
        children: [],
        probabilite: parent.type === 'aleatoire' ? 1 / Math.max(parent.children.length + 1, 1) : undefined,
        valeur: type === 'feuille' ? 0 : undefined
      };

      const updatedState: TreeState = {
        ...current,
        nodes: {
          ...current.nodes,
          [nouveau.id]: nouveau
        }
      };

      const withParent = ajouterLienParent(updatedState, parentId, nouveau.id);
      if (parent.type === 'aleatoire') {
        const parentAfter = withParent.nodes[parentId];
        const egalite = parentAfter.children.length > 0 ? 1 / parentAfter.children.length : 0;
        const recalcules: Record<string, TreeNode> = { ...withParent.nodes };
        parentAfter.children.forEach((childId) => {
          const child = recalcules[childId];
          if (child) {
            recalcules[childId] = { ...child, probabilite: egalite };
          }
        });
        return mettreAJourHorodatage({
          ...withParent,
          nodes: recalcules
        });
      }
      return mettreAJourHorodatage(withParent);
    });
  }, []);

  const supprimerNoeud = useCallback((id: string) => {
    setState((current) => {
      if (id === current.rootId) {
        return current;
      }
      const node = current.nodes[id];
      if (!node) {
        return current;
      }

      const parent = node.parentId ? current.nodes[node.parentId] : undefined;
      const newNodes = { ...current.nodes };

      const supprimerRecursif = (nodeId: string) => {
        const cible = newNodes[nodeId];
        if (!cible) {
          return;
        }
        cible.children.forEach(supprimerRecursif);
        delete newNodes[nodeId];
      };
      supprimerRecursif(id);

      if (parent) {
        newNodes[parent.id] = {
          ...parent,
          children: parent.children.filter((childId) => childId !== id)
        };
      }

      return mettreAJourHorodatage({
        ...current,
        nodes: newNodes
      });
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setState(creerEtatInitial());
  }, []);

  const valeurCourante = useMemo(() => {
    if (!state.rootId) {
      return 0;
    }
    return valeurAttendue(state.rootId, state);
  }, [state]);

  const exporter = useCallback(() => serialiserEtat(state), [state]);

  const importer = useCallback((texte: string) => {
    setState(() => {
      const resultat = desserialiserEtat(texte);
      return mettreAJourHorodatage(resultat);
    });
  }, []);

  return {
    state,
    mettreAJourNoeud,
    ajouterEnfant,
    supprimerNoeud,
    reinitialiser,
    valeurCourante,
    exporter,
    importer
  };
};

export const useProbabiliteTotale = (nodeId: string, state: TreeState): number =>
  useMemo(() => probabiliteTotale(nodeId, state), [nodeId, state]);
