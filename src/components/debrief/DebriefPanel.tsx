"use client";

import { useGameStore } from "@/store/game-store";
import { ANOMALY_LABELS } from "@/components/ui-labels";

/** Débrief pédagogique de fin de partie. */
export function DebriefPanel() {
  const debrief = useGameStore((s) => s.debrief);
  const reset = useGameStore((s) => s.reset);

  if (!debrief) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-black">Débrief — {debrief.scenarioTitle}</h1>
        <div className="mt-3 inline-flex items-center gap-3 rounded-full bg-slate-800 px-5 py-2">
          <span className="text-3xl font-black text-amber-300">
            {debrief.score}
          </span>
          <span className="text-slate-400">/ 100</span>
          <span
            className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
              debrief.passed
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {debrief.passed ? "Réussi" : "À revoir"}
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">
            Bonne réponse
          </h2>
          <p className="text-sm">
            Contact : <span className="text-amber-300">{debrief.expected.contactId}</span>
          </p>
          <p className="text-sm">
            Anomalie :{" "}
            <span className="text-amber-300">
              {ANOMALY_LABELS[debrief.expected.anomalyType]}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">
            Ton diagnostic
          </h2>
          <p className="text-sm">
            Contact : {debrief.playerDiagnosis.contactId}{" "}
            {debrief.contactCorrect ? "✅" : "❌"}
          </p>
          <p className="text-sm">
            Anomalie : {ANOMALY_LABELS[debrief.playerDiagnosis.anomalyType]}{" "}
            {debrief.anomalyCorrect ? "✅" : "❌"}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Explication</h2>
        <p className="text-sm text-slate-200">{debrief.explanation}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Block title="Évaluation" items={debrief.feedback} />
        {debrief.missedEvidence.length > 0 && (
          <Block title="Indices peu exploités" items={debrief.missedEvidence} />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Block
          title="Notions apprises"
          items={debrief.pedagogicalGoals}
        />
        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-sm">
          <h2 className="mb-2 font-semibold text-slate-300">Tes leviers</h2>
          <p className="text-slate-400">
            Agents sollicités :{" "}
            {debrief.mostUsefulAgents.join(", ") || "aucun"}
          </p>
          <p className="text-slate-400">
            Skills utiles : {debrief.usefulSkills.join(", ") || "aucune"}
          </p>
        </div>
      </section>

      <button
        onClick={reset}
        className="mx-auto rounded-md bg-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-400"
      >
        ↻ Rejouer
      </button>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">{title}</h2>
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
