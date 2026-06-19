import type { ContactTrack } from "@/types";
import { CATEGORY_LABEL } from "./contact-visuals";

type ContactDetailsPanelProps = {
  contact?: ContactTrack;
};

function bar(label: string, value: number) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{Math.round(value * 100)} %</span>
      </div>
      <div className="mt-0.5 h-1.5 rounded bg-slate-700">
        <div
          className="h-1.5 rounded bg-sky-400"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Panneau de détails d'un contact sélectionné. */
export function ContactDetailsPanel({ contact }: ContactDetailsPanelProps) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3 backdrop-blur">
      <h2 className="mb-2 text-sm font-semibold text-slate-300">
        Contact sélectionné
      </h2>
      {!contact ? (
        <p className="text-sm text-slate-500">Clique un contact sur la carte.</p>
      ) : (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-amber-300">
            {contact.id} — {CATEGORY_LABEL[contact.category]}
          </p>
          <p className="text-slate-400">
            {contact.label} · {contact.affiliation}
          </p>
          <div className="space-y-1.5 pt-1">
            {bar("Suspicion", contact.suspicionScore)}
            {bar("Confiance radar", contact.radarConfidence)}
            {bar("Confiance AIS", contact.aisConfidence)}
            {bar("Confiance optronique", contact.optronicConfidence)}
          </div>
          <p className="pt-1 text-xs text-slate-400">
            Indices : {contact.flags.join(", ") || "aucun"}
          </p>
        </div>
      )}
    </section>
  );
}
