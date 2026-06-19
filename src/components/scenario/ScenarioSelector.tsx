"use client";

import { listScenarioMeta } from "@/data/scenarios";
import { useGameStore } from "@/store/game-store";
import { DIFFICULTY_LABEL } from "@/components/ui-labels";

const SCENARIOS = listScenarioMeta();

/** Écran d'accueil : choix d'un des 3 scénarios V1. */
export function ScenarioSelector() {
  const start = useGameStore((s) => s.start);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="text-center">
        <h1 className="text-5xl font-black tracking-tight">
          🛰️{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent">
            Agent Us
          </span>
        </h1>
        <p className="mt-2 text-slate-400">
          Serious game naval multi-agents — observe, interroge les agents IA et
          identifie le comportement anormal.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {SCENARIOS.map((s) => (
          <article
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                {DIFFICULTY_LABEL[s.difficulty]}
              </span>
              <span className="text-xs text-slate-500">~{s.estimatedMinutes} min</span>
            </div>
            <h2 className="text-lg font-bold text-amber-300">{s.title}</h2>
            <p className="flex-1 text-sm text-slate-300">{s.objective}</p>
            <button
              onClick={() => start(s.id)}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
            >
              Lancer la mission ▶
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
