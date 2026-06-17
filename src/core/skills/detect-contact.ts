import type { RadarObservation, SkillResult } from "@/types";

/**
 * detect_contact — décrit un contact radar simulé et signale l'incertitude.
 * N'infère jamais d'hostilité ; recommande un croisement capteur si la
 * confiance est faible.
 */
export function detectContact(input: RadarObservation): SkillResult {
  const lowConfidence = input.radarConfidence < 0.5;

  return {
    skill: "detect_contact",
    summary: lowConfidence
      ? `Contact ${input.contactId} détecté mais la confiance radar est faible.`
      : `Contact ${input.contactId} suivi correctement.`,
    confidence: input.radarConfidence,
    flags: lowConfidence ? ["low_radar_confidence"] : [],
    recommendedAction: lowConfidence
      ? "Demander une confirmation optronique."
      : "Continuer le suivi.",
  };
}
