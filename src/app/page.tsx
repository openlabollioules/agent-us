"use client";

import { useState } from "react";
import { simulationController } from "@/core/controller";
import { listScenarioMeta } from "@/data/scenarios";
import { TacticalMap, CATEGORY_LABEL } from "@/components/tactical-map";
import type { TacticalState } from "@/types";

const SCENARIOS = listScenarioMeta();

export default function Home() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [state, setState] = useState<TacticalState>(() =>
    simulationController.start(SCENARIOS[0].id, "demo"),
  );
  const [selected, setSelected] = useState<string | undefined>(undefined);

  function restart(id: string) {
    setScenarioId(id);
    setState(simulationController.start(id, "demo"));
    setSelected(undefined);
  }

  function step() {
    setState((s) => simulationController.step(s));
  }

  const selectedContact = state.contacts.find((c) => c.id === selected);
  const lastMessages = state.agentMessages.slice(-4).reverse();

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-slate-900 p-4 text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          🛰️ Agent Us{" "}
          <span className="text-sm font-normal text-slate-400">
            — carte tactique (démo Phase 11)
          </span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => restart(s.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                s.id === scenarioId
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-h-[60vh]">
          <TacticalMap
            state={state}
            selectedContactId={selected}
            onSelectContact={setSelected}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Tour {state.turn} · {state.status}
              </span>
              <button
                onClick={step}
                disabled={state.status !== "running"}
                className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Tour suivant ▶
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Contact sélectionné
            </h2>
            {selectedContact ? (
              <ul className="space-y-1 text-sm">
                <li className="font-semibold text-amber-300">
                  {selectedContact.id} —{" "}
                  {CATEGORY_LABEL[selectedContact.category]}
                </li>
                <li>Affiliation : {selectedContact.affiliation}</li>
                <li>
                  Suspicion : {Math.round(selectedContact.suspicionScore * 100)}{" "}
                  %
                </li>
                <li>
                  Confiance radar :{" "}
                  {Math.round(selectedContact.radarConfidence * 100)} %
                </li>
                <li className="text-slate-400">
                  Flags : {selectedContact.flags.join(", ") || "aucun"}
                </li>
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                Clique un contact sur la carte.
              </p>
            )}
          </section>

          <section className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <h2 className="mb-2 text-sm font-semibold text-slate-300">
              Console agents
            </h2>
            <ul className="space-y-2 text-sm">
              {lastMessages.map((m) => (
                <li key={m.id} className="rounded bg-slate-900/60 p-2">
                  <span className="font-semibold text-sky-300">
                    {m.agentName}
                  </span>
                  <p className="text-slate-300">{m.message}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
