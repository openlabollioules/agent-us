import type { AcousticReport, SkillResult } from "@/types";

/** Libellé FR d'une classification acoustique. */
const CLASSIFICATION_LABEL: Record<
  NonNullable<AcousticReport["classification"]>,
  string
> = {
  biologic: "origine biologique (faune marine)",
  surface_traffic: "trafic de surface",
  submerged: "contact immergé",
  unknown: "origine indéterminée",
};

/**
 * classify_acoustic_contact — interprète une piste acoustique (relèvement +
 * classification). L'acoustique ne donne pas de position : elle oriente, sans
 * prouver. Un contact "immergé" justifie un croisement avec radar/optronique.
 */
export function classifyAcousticContact(report: AcousticReport): SkillResult {
  if (!report.hasTrack) {
    return {
      skill: "classify_acoustic_contact",
      summary: "Aucune piste acoustique corrélée à ce contact.",
      confidence: 0,
      flags: [],
      recommendedAction: "Maintenir l'écoute acoustique.",
    };
  }

  const label = CLASSIFICATION_LABEL[report.classification ?? "unknown"];
  const submerged = report.classification === "submerged";

  return {
    skill: "classify_acoustic_contact",
    summary: `Piste acoustique au relèvement ${report.bearingDeg}° : ${label} (confiance ${Math.round(
      report.confidence * 100,
    )} %).`,
    confidence: report.confidence,
    flags: submerged ? ["acoustic_only"] : [],
    recommendedAction: submerged
      ? "Croiser avec radar et optronique : faisceau possible de contact sous-marin."
      : "Confirmer la classification avant toute conclusion.",
  };
}
