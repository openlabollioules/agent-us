"use client";

import { useState } from "react";
import { useGameStore } from "@/store/game-store";
import { TacticalMap, ContactDetailsPanel } from "@/components/tactical-map";
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

  if (!state) return null;

  const selectedContact = state.contacts.find((c) => c.id === selectedContactId);
  const awaiting = state.status === "awaiting_player";

  return (
    <div className="flex h-screen flex-col gap-3 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">🛰️ Agent Us</h1>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>
            Tour <span className="font-semibold text-slate-200">{state.turn}</span> ·{" "}
            {state.status}
          </span>
          <button
            onClick={step}
            disabled={state.status !== "running"}
            className="rounded-md bg-sky-500 px-3 py-1.5 font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-40"
          >
            Tour suivant ▶
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
            <TacticalMap
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
          <ContactDetailsPanel contact={selectedContact} />
          <div className="min-h-0 flex-1">
            <AgentConsole
              messages={state.agentMessages}
              onSelectContact={selectContact}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
