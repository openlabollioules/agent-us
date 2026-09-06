"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TacticalEvent } from "@/types";
import { useGameStore } from "@/store/game-store";
import { getScenario } from "@/data/scenarios";
import { STATUS_LABEL } from "@/components/ui-labels";
import { ContactDetailsPanel } from "@/components/tactical-map";
import { TacticalViewport } from "@/components/tactical-map/TacticalViewport";
import { AgentConsole } from "@/components/agents/AgentConsole";
import { ActionSuggestions } from "@/components/actions/ActionSuggestions";
import { FreeInstructionInput } from "@/components/actions/FreeInstructionInput";
import { Timeline } from "@/components/timeline/Timeline";
import { DiagnosisPanel } from "@/components/debrief/DiagnosisPanel";

/** Écran de jeu principal : assemble tous les panneaux autour de la carte. */
export function GameScreen() {
  const state = useGameStore((s) => s.state);
  const selectedContactId = useGameStore((s) => s.selectedContactId);
  const selectContact = useGameStore((s) => s.selectContact);
  const step = useGameStore((s) => s.step);
  const sendInstruction = useGameStore((s) => s.sendInstruction);
  const runSuggestion = useGameStore((s) => s.runSuggestion);
  const submitDiagnosis = useGameStore((s) => s.submitDiagnosis);
  const reset = useGameStore((s) => s.reset);

  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [alert, setAlert] = useState<TacticalEvent | null>(null);
  const shownAlertId = useRef<string | undefined>(undefined);

  const latestHighId = state
    ? [...state.events].reverse().find((e) => e.severity === "high")?.id
    : undefined;

  useEffect(() => {
    if (!state || !latestHighId) return;
    if (latestHighId === shownAlertId.current) return;
    shownAlertId.current = latestHighId;
    const high = state.events.find((e) => e.id === latestHighId) ?? null;
    setAlert(high);
    const t = setTimeout(() => setAlert(null), 3200);
    return () => clearTimeout(t);
  }, [latestHighId, state]);

  // Lecture automatique des tours
  const [auto, setAuto] = useState(false);
  const running = state?.status === "running";
  useEffect(() => {
    if (!auto || !running) return;
    const id = setInterval(() => step(), 2200);
    return () => clearInterval(id);
  }, [auto, running, state, step]);

  // Raccourcis clavier : Espace = tour suivant, Échap = fermer/désélectionner
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state?.status === "running") step();
      } else if (e.key === "Escape") {
        setShowDiagnosis(false);
        selectContact(undefined);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, step, selectContact]);

  if (!state) return null;

  const selectedContact = state.contacts.find((c) => c.id === selectedContactId);
  const awaiting = state.status === "awaiting_player";
  const maxTurns = getScenario(state.scenarioId).maxTurns;
  const progress = Math.min(100, Math.round((state.turn / maxTurns) * 100));

  return (
    <div className="relative flex h-screen flex-col gap-3 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-2 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight">
          🛰️{" "}
          <span className="bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text text-transparent">
            Agent Us
          </span>
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <span>
              Tour{" "}
              <span className="font-semibold text-slate-200">{state.turn}</span>
              /{maxTurns}
            </span>
            <span className="hidden h-1.5 w-24 overflow-hidden rounded bg-slate-700 sm:block">
              <span
                className="block h-full rounded bg-sky-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-200">
              {STATUS_LABEL[state.status]}
            </span>
          </span>
          <button
            onClick={step}
            disabled={state.status !== "running"}
            title="Espace"
            className="rounded-md bg-sky-500 px-3 py-1.5 font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-40"
          >
            Tour suivant ▶
          </button>
          <button
            onClick={() => setAuto((v) => !v)}
            disabled={state.status !== "running"}
            className={`rounded-md px-3 py-1.5 font-semibold disabled:opacity-40 ${
              auto
                ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
          >
            {auto ? "⏸ Auto" : "▶ Auto"}
          </button>
          <button
            onClick={() => setShowDiagnosis((v) => !v)}
            className={`rounded-md px-3 py-1.5 font-semibold ${
              awaiting
                ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
          >
            🎯 Diagnostic
          </button>
          <button
            onClick={reset}
            className="rounded-md bg-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-600"
          >
            Quitter
          </button>
        </div>
      </header>

      {awaiting && !showDiagnosis && (
        <p className="rounded-md bg-amber-500/15 px-3 py-2 text-sm text-amber-300">
          La situation est mûre : ouvre le <strong>Diagnostic</strong> pour
          conclure.
        </p>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[260px_1fr_330px]">
        {/* Colonne gauche : timeline + suggestions */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <Timeline events={state.events} onSelectContact={selectContact} />
          </div>
          <ActionSuggestions
            actions={state.suggestedActions}
            onRun={runSuggestion}
          />
        </div>

        {/* Colonne centrale : carte + instruction + diagnostic */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <TacticalViewport
              state={state}
              selectedContactId={selectedContactId}
              onSelectContact={selectContact}
            />
          </div>
          <FreeInstructionInput onSend={sendInstruction} />
          {showDiagnosis && (
            <DiagnosisPanel
              contacts={state.contacts}
              onSubmit={submitDiagnosis}
            />
          )}
        </div>

        {/* Colonne droite : contact + console agents */}
        <div className="flex min-h-0 flex-col gap-3">
          <ContactDetailsPanel
            contact={selectedContact}
            onAsk={(c) =>
              sendInstruction(
                `ThreatAssessmentAgent, fais une synthèse de la situation pour ${c.id}.`,
              )
            }
          />
          <div className="min-h-0 flex-1">
            <AgentConsole
              messages={state.agentMessages}
              onSelectContact={selectContact}
            />
          </div>
        </div>
      </div>

      {/* Emergency Meeting — bandeau non bloquant (la carte reste visible) */}
      <AnimatePresence>
        {alert && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-4 z-50"
            initial={{ opacity: 0, y: -24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border-2 border-red-500/60 bg-slate-900/95 px-5 py-3 shadow-2xl shadow-red-900/40">
              <motion.span
                className="text-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              >
                🚨
              </motion.span>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-widest text-red-400">
                  ALERTE
                </p>
                <p className="truncate text-sm font-semibold text-slate-100">
                  {alert.title}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {alert.description}
                </p>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="ml-1 shrink-0 rounded-md bg-red-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-400"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
