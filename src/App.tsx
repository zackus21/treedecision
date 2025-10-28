import { useMemo, useState } from 'react';
import { TreeNodeEditor } from './components/TreeNodeEditor';
import { useTreeState } from './hooks/useTreeState';
import { probabiliteTotale, valeurAttendue } from './utils/tree';

function App() {
  const { state, ajouterEnfant, mettreAJourNoeud, supprimerNoeud, reinitialiser, valeurCourante, exporter, importer } =
    useTreeState();
  const [exportVisible, setExportVisible] = useState(false);
  const [importTexte, setImportTexte] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const expectedValues = useMemo(() => {
    const cache = new Map<string, number>();
    return Object.fromEntries(
      Object.keys(state.nodes).map((id) => [id, valeurAttendue(id, state, cache)])
    ) as Record<string, number>;
  }, [state]);

  const probabilitySums = useMemo(() => {
    const result: Record<string, number> = {};
    Object.keys(state.nodes).forEach((id) => {
      result[id] = probabiliteTotale(id, state);
    });
    return result;
  }, [state]);

  const racine = state.rootId ? state.nodes[state.rootId] : null;

  const handleExport = () => {
    setExportVisible(true);
    setImportTexte(exporter());
    setMessage({ type: 'info', text: 'Arbre exporté. Vous pouvez copier le JSON.' });
  };

  const handleImport = () => {
    try {
      importer(importTexte);
      setMessage({ type: 'success', text: 'Import réussi ✅' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Import impossible : le format JSON est invalide.' });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-white">TreeDecision</h1>
        <p className="text-sm text-slate-300">
          Construisez des arbres de décision interactifs, calculez la valeur espérée par rollback et sauvegardez vos scénarios.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <span className="rounded-full bg-slate-800/80 px-3 py-1">Valeur actuelle&nbsp;: <strong className="text-accent">{valeurCourante.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</strong></span>
          {state.derniereModification && (
            <span className="rounded-full bg-slate-800/80 px-3 py-1">
              Dernière modification&nbsp;: {new Date(state.derniereModification).toLocaleString('fr-FR')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-accent hover:bg-accent/20"
            onClick={reinitialiser}
          >
            Nouveau depuis zéro
          </button>
          <button
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-accent hover:bg-accent/20"
            onClick={handleExport}
          >
            Exporter JSON
          </button>
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.type === 'success'
                ? 'text-emerald-300'
                : message.type === 'error'
                  ? 'text-red-300'
                  : 'text-sky-300'
            }`}
          >
            {message.text}
          </p>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-6 pb-12">
        {racine ? (
          <TreeNodeEditor
            node={racine}
            state={state}
            expectedValues={expectedValues}
            probabilitySums={probabilitySums}
            onAdd={ajouterEnfant}
            onUpdate={mettreAJourNoeud}
            onDelete={supprimerNoeud}
          />
        ) : (
          <p className="text-slate-300">Aucun arbre à afficher.</p>
        )}

        <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <h2 className="text-lg font-semibold text-white">Importer / Exporter</h2>
          <p className="text-sm text-slate-300">
            Collez un JSON exporté précédemment pour restaurer un arbre, ou copiez le texte généré pour partager votre travail.
          </p>
          <textarea
            className="h-48 w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
            placeholder="{\n  \"nodes\": { ... }\n}"
            value={importTexte}
            onChange={(event) => setImportTexte(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-accent hover:bg-accent/20"
              onClick={handleImport}
            >
              Importer JSON
            </button>
            {exportVisible && (
              <button
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-400 hover:bg-emerald-400/20"
                onClick={() => {
                  if (navigator?.clipboard?.writeText) {
                    navigator.clipboard
                      .writeText(importTexte)
                      .then(() => setMessage({ type: 'success', text: 'Copié dans le presse-papiers ✅' }))
                      .catch(() => setMessage({ type: 'error', text: 'Impossible de copier automatiquement.' }));
                  } else {
                    setMessage({ type: 'error', text: 'Copiez manuellement le JSON (presse-papiers inaccessible).' });
                  }
                }}
              >
                Copier dans le presse-papiers
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 pt-4 text-xs text-slate-500">
        <p>
          Les données sont enregistrées automatiquement dans votre navigateur (localStorage). Pensez à exporter votre arbre pour le partager.
        </p>
      </footer>
    </div>
  );
}

export default App;
