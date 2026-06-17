import type { ContactTrack, SkillResult } from "@/types";

export type SuspicionLevel = "low" | "medium" | "high";

/** Niveau de suspicion qualitatif à partir du score (0..1). */
export function suspicionLevel(score: number): SuspicionLevel {
  return score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";
}

/**
 * estimate_threat_level — estime un niveau de *suspicion* fictif (jamais une
 * certitude de menace). Ne recommande aucune action offensive ; l'humain
 * conserve l'autorité de décision.
 */
export function estimateThreatLevel(contact: ContactTrack): SkillResult {
  const level = suspicionLevel(contact.suspicionScore);

  const labels: Record<SuspicionLevel, string> = {
    low: "faible",
    medium: "moyen",
    high: "élevé",
  };

  return {
    skill: "estimate_threat_level",
    summary: `Niveau de suspicion pour ${contact.id} : ${labels[level]}.`,
    confidence: contact.suspicionScore,
    flags: [],
    recommendedAction:
      level === "high"
        ? "Proposer à l'opérateur humain de poser un diagnostic."
        : "Continuer à recueillir des indices.",
  };
}
