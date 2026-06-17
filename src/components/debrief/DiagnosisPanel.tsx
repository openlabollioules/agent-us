"use client";

import { useState } from "react";
import type { AnomalyType, ContactTrack } from "@/types";
import { ANOMALY_LABELS } from "@/components/ui-labels";

type DiagnosisPanelProps = {
  contacts: ContactTrack[];
  onSubmit: (diagnosis: {
    contactId: string;
    anomalyType: AnomalyType;
    justification: string;
    playerConfidence: number;
  }) => void;
};

const ANOMALY_TYPES = Object.keys(ANOMALY_LABELS) as AnomalyType[];

/** Formulaire de décision finale du joueur. */
export function DiagnosisPanel({ contacts, onSubmit }: DiagnosisPanelProps) {
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [anomalyType, setAnomalyType] = useState<AnomalyType>("discreet_following");
  const [justification, setJustification] = useState("");
  const [confidence, setConfidence] = useState(60);

  return (
    <section className="rounded-lg border border-amber-500/40 bg-slate-800/80 p-4">
      <h2 className="mb-3 text-base font-bold text-amber-300">
        🎯 Poser le diagnostic final
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-400">Contact suspect</span>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-slate-400">Type d&apos;anomalie</span>
          <select
            value={anomalyType}
            onChange={(e) => setAnomalyType(e.target.value as AnomalyType)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
          >
            {ANOMALY_TYPES.map((a) => (
              <option key={a} value={a}>
                {ANOMALY_LABELS[a]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block text-sm">
        <span className="text-slate-400">Justification</span>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={3}
          placeholder="Quels indices t'ont conduit à cette conclusion ?"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
        />
      </label>

      <label className="mt-3 block text-sm">
        <span className="text-slate-400">
          Niveau de confiance : {confidence} %
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="mt-1 w-full accent-amber-400"
        />
      </label>

      <button
        onClick={() =>
          onSubmit({
            contactId,
            anomalyType,
            justification,
            playerConfidence: confidence / 100,
          })
        }
        disabled={!contactId}
        className="mt-4 w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-40"
      >
        Valider le diagnostic
      </button>
    </section>
  );
}
