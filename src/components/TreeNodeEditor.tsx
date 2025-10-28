import { Fragment } from 'react';
import type { TreeNode, TreeState, NodeType } from '../types';

interface TreeNodeEditorProps {
  node: TreeNode;
  state: TreeState;
  expectedValues: Record<string, number>;
  probabilitySums: Record<string, number>;
  onAdd: (parentId: string, type: NodeType) => void;
  onUpdate: (id: string, patch: Partial<TreeNode>) => void;
  onDelete: (id: string) => void;
}

const typeLibelle: Record<NodeType, string> = {
  decision: 'Décision',
  aleatoire: 'Chance',
  feuille: 'Résultat'
};

const boutonConfig: { type: NodeType; label: string }[] = [
  { type: 'decision', label: 'Ajouter une décision' },
  { type: 'aleatoire', label: 'Ajouter un événement' },
  { type: 'feuille', label: 'Ajouter une feuille' }
];

const formatNombre = (value: number | undefined): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export function TreeNodeEditor({
  node,
  state,
  expectedValues,
  probabilitySums,
  onAdd,
  onUpdate,
  onDelete
}: TreeNodeEditorProps) {
  const parent = node.parentId ? state.nodes[node.parentId] : undefined;
  const valeur = expectedValues[node.id];
  const sommeProbabilites = probabilitySums[node.id];

  const canAddChildren = node.type !== 'feuille';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 shadow-md">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">{typeLibelle[node.type]}</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1 text-sm focus:border-accent focus:outline-none"
            value={node.titre}
            onChange={(event) => onUpdate(node.id, { titre: event.target.value })}
          />
        </div>
        {parent && (
          <button
            className="shrink-0 rounded-md border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-300 hover:border-red-400 hover:bg-red-400/10"
            onClick={() => onDelete(node.id)}
          >
            Supprimer
          </button>
        )}
      </div>

      <textarea
        className="mb-3 w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        rows={2}
        placeholder="Description..."
        value={node.description ?? ''}
        onChange={(event) => onUpdate(node.id, { description: event.target.value })}
      />

      {parent?.type === 'aleatoire' && (
        <div className="mb-3 space-y-1 text-sm text-slate-300">
          <label className="flex items-center justify-between gap-4">
            <span>Probabilité depuis «&nbsp;{parent.titre}&nbsp;»</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="w-24 rounded-md border border-slate-600 bg-slate-900/60 px-2 py-1 text-right focus:border-accent focus:outline-none"
              value={node.probabilite ?? 0}
              onChange={(event) => onUpdate(node.id, { probabilite: Number(event.target.value) })}
            />
          </label>
        </div>
      )}

      {node.type === 'feuille' && (
        <div className="mb-3 space-y-1 text-sm text-slate-300">
          <label className="flex items-center justify-between gap-4">
            <span>Valeur (gain ou coût)</span>
            <input
              type="number"
              className="w-32 rounded-md border border-slate-600 bg-slate-900/60 px-2 py-1 text-right focus:border-accent focus:outline-none"
              value={node.valeur ?? 0}
              onChange={(event) => onUpdate(node.id, { valeur: Number(event.target.value) })}
            />
          </label>
        </div>
      )}

      {node.type === 'decision' && (
        <div className="mb-3 space-y-1 text-sm text-slate-300">
          <label className="flex items-center justify-between gap-4">
            <span>Valeur immédiate (optionnel)</span>
            <input
              type="number"
              className="w-32 rounded-md border border-slate-600 bg-slate-900/60 px-2 py-1 text-right focus:border-accent focus:outline-none"
              value={node.valeur ?? 0}
              onChange={(event) => onUpdate(node.id, { valeur: Number(event.target.value) })}
            />
          </label>
        </div>
      )}

      <div className="mb-4 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span>Valeur espérée</span>
          <span className="font-semibold text-accent">{formatNombre(valeur)}</span>
        </div>
        {node.type === 'aleatoire' && (
          <div className={`mt-1 text-xs ${Math.abs((sommeProbabilites ?? 0) - 1) < 0.001 ? 'text-emerald-300' : 'text-amber-400'}`}>
            Somme des probabilités&nbsp;: {formatNombre(sommeProbabilites)}
          </div>
        )}
      </div>

      {canAddChildren && (
        <div className="flex flex-wrap gap-2">
          {boutonConfig.map(({ type, label }) => (
            <button
              key={type}
              className="rounded-md border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-accent hover:bg-accent/20"
              onClick={() => onAdd(node.id, type)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {node.children.length > 0 && (
        <div className="mt-4 border-t border-slate-700 pt-4">
          <div className="space-y-3">
            {node.children.map((childId) => {
              const child = state.nodes[childId];
              if (!child) {
                return null;
              }
              return (
                <Fragment key={child.id}>
                  <TreeNodeEditor
                    node={child}
                    state={state}
                    expectedValues={expectedValues}
                    probabilitySums={probabilitySums}
                    onAdd={onAdd}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
