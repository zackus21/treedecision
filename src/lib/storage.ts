import type { Tree } from './tree';

const STORAGE_KEY = 'treedecision:tree';

/**
 * Sauvegarde l'arbre courant dans le localStorage du navigateur.
 * Les accès sont protégés pour éviter les erreurs en environnement non web.
 */
export const sauvegarderArbre = (tree: Tree): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    const payload = JSON.stringify(tree);
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.error('Impossible de sauvegarder le scénario dans le stockage local.', error);
  }
};

/**
 * Recharge un arbre depuis le localStorage. Retourne null si aucune sauvegarde valide.
 */
export const chargerArbre = (): Tree | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Tree;
  } catch (error) {
    console.warn('Lecture du scénario depuis le stockage local impossible.', error);
    return null;
  }
};

/**
 * Produit une chaîne JSON formatée, prête à être téléchargée ou copiée par l'utilisateur.
 */
export const exporterJSON = (tree: Tree): string => {
  return JSON.stringify(tree, null, 2);
};

/**
 * Convertit un texte JSON en structure d'arbre. Déclenche une erreur si le JSON est invalide.
 */
export const importerJSON = (texte: string): Tree => {
  const parsed = JSON.parse(texte);
  return parsed as Tree;
};
