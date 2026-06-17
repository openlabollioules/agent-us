import type { SuggestedAction } from "@/types";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/components/ui-labels";

type ActionSuggestionsProps = {
  actions: SuggestedAction[];
  onRun?: (action: SuggestedAction) => void;
};

/** Liste des actions suggérées au joueur (priorité, explication pédagogique). */
export function ActionSuggestions({ actions, onRun }: ActionSuggestionsProps) {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">
        Actions suggérées
      </h2>
      {actions.length === 0 ? (
        <p className="text-sm text-slate-500">
          Rien à suggérer pour l&apos;instant — avance d&apos;un tour ou observe.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-slate-700 bg-slate-900/50 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-100">
                  {a.label}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${PRIORITY_COLOR[a.priority]}`}
                >
                  {PRIORITY_LABEL[a.priority]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{a.description}</p>
              <button
                onClick={() => onRun?.(a)}
                className="mt-2 rounded bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-500"
              >
                Exécuter ▶
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
