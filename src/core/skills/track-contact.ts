import type { ContactTrack, SkillResult } from "@/types";

/**
 * track_contact — analyse l'évolution d'un contact sur plusieurs tours.
 * Ne surinterprète pas un seul mouvement et signale un historique insuffisant.
 */
export function trackContact(contact: ContactTrack): SkillResult {
  const last = contact.history.at(-1);
  const previous = contact.history.at(-2);

  if (!last || !previous) {
    return {
      skill: "track_contact",
      summary: "Historique insuffisant pour analyser la trajectoire.",
      confidence: 0.3,
      flags: ["insufficient_history"],
      recommendedAction: "Continuer le suivi pendant un tour supplémentaire.",
    };
  }

  const headingDelta = Math.abs(last.headingDeg - previous.headingDeg);
  const speedDelta = Math.abs(last.speedKnots - previous.speedKnots);
  const abnormal = headingDelta > 25 || speedDelta > 8;

  return {
    skill: "track_contact",
    summary: abnormal
      ? `Le contact ${contact.id} présente un changement de mouvement notable.`
      : `La trajectoire du contact ${contact.id} est stable.`,
    confidence: abnormal ? 0.72 : 0.6,
    flags: abnormal ? ["trajectory_anomaly"] : [],
    recommendedAction: abnormal
      ? "Demander au NavigationAgent d'analyser la cohérence de la trajectoire."
      : "Continuer la surveillance.",
  };
}
