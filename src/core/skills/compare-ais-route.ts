import type { AISData, ContactTrack, SkillResult } from "@/types";

/**
 * compare_ais_route — compare la route observée avec la route AIS déclarée.
 * L'AIS est déclaratif : une incohérence n'est pas automatiquement une menace.
 */
export function compareAisRoute(
  contact: ContactTrack,
  ais: AISData,
): SkillResult {
  const mismatch = ais.declaredRouteStatus === "mismatch";
  const missing = ais.declaredRouteStatus === "missing";

  return {
    skill: "compare_ais_route",
    summary: missing
      ? `Aucune route AIS n'est disponible pour ${contact.id}.`
      : mismatch
        ? `La trajectoire observée de ${contact.id} diffère de sa route AIS déclarée.`
        : `La trajectoire observée de ${contact.id} est cohérente avec l'AIS.`,
    confidence: mismatch ? 0.82 : missing ? 0.55 : 0.65,
    flags: mismatch ? ["ais_route_mismatch"] : missing ? ["ais_missing"] : [],
    recommendedAction: mismatch
      ? "Demander au ThreatAssessmentAgent d'intégrer cette incohérence à l'analyse."
      : "Continuer la surveillance.",
  };
}
