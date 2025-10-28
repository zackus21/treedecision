# TreeDecision

Prototype web d’arbres de décision réalisé avec React, TypeScript, Vite et Tailwind CSS.

## Fonctionnalités

- Création d’un arbre de décision interactif (nœuds de décision, chance et feuille)
- Calcul automatique de la valeur espérée (rollback) pour chaque nœud
- Édition des probabilités et des valeurs directement dans l’interface
- Sauvegarde automatique dans le `localStorage`
- Export et import du modèle au format JSON
- Interface entièrement en français

## Démarrer le projet

```bash
npm install
npm run dev
```

L’application sera accessible sur [http://localhost:5173](http://localhost:5173).

## Construction et prévisualisation

```bash
npm run build
npm run preview
```

## Structure principale

- `src/App.tsx` : interface principale et gestion des actions
- `src/components/TreeNodeEditor.tsx` : édition récursive des nœuds de l’arbre
- `src/hooks/useTreeState.ts` : logique métier (CRUD, rollback, persistance locale)
- `src/utils/tree.ts` : utilitaires de calcul et sérialisation

## Licence

Projet à usage démonstratif.
