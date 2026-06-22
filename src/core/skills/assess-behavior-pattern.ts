import type { BehaviorPattern, BehaviorProfile, SkillResult } from "@/types";

/** Libellé FR d'un motif de comportement. */
const PATTERN_LABEL: Record<BehaviorPattern, string> = {
  transit: "transit normal",
  loitering: "stationnement (loitering)",
  erratic: "trajectoire erratique",
  shadowing: "suivi discret (shadowing)",
  fishing: "activité de pêche",
  diving: "plongée/réapparition",
};

/** Seuil de cohérence en dessous duquel un comportement est jugé ambigu. */
const AMBIGUOUS_THRESHOLD = 0.6;

/**
 * assess_behavior_pattern — interprète le profil de comportement déduit pour un
 * contact. Une faible cohérence signale un comportement ambigu : il faut alors
 * éviter de conclure (ni clairement normal, ni clairement suspect).
 */
export function assessBehaviorPattern(
  profile: BehaviorProfile | undefined,
): SkillResult {
  if (!profile) {
    return {
      skill: "assess_behavior_pattern",
      summary: "Pas encore assez d'observations pour établir un comportement.",
      confidence: 0,
      flags: ["insufficient_history"],
      recommendedAction: "Continuer le suivi sur plusieurs tours.",
    };
  }

  const ambiguous = profile.consistency < AMBIGUOUS_THRESHOLD;

  return {
    skill: "assess_behavior_pattern",
    summary: `Comportement de ${profile.contactId} : ${PATTERN_LABEL[profile.pattern]} (cohérence ${Math.round(
      profile.consistency * 100,
    )} %). ${profile.note}`,
    confidence: profile.consistency,
    flags: ambiguous ? ["low_confidence"] : [],
    recommendedAction: ambiguous
      ? "Comportement ambigu : maintenir la surveillance sans conclure."
      : "Comportement cohérent : intégrer ce motif dans la synthèse.",
  };
}
