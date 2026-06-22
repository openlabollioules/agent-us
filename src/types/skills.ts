import type { ContactFlag } from "./tactical";

/**
 * Drapeaux analytiques produits par une skill mais qui ne s'attachent pas
 * forcément à un contact (ex : confiance combinée trop faible).
 */
export type AnalysisFlag = "low_confidence" | "insufficient_history";

/**
 * Une skill peut émettre soit un drapeau de contact, soit un drapeau d'analyse.
 * (Correction du plan : `low_confidence` n'était pas un ContactFlag valide.)
 */
export type SkillFlag = ContactFlag | AnalysisFlag;

export type SkillName =
  | "detect_contact"
  | "track_contact"
  | "compare_ais_route"
  | "detect_abnormal_trajectory"
  | "classify_surface_contact"
  | "estimate_confidence"
  | "estimate_threat_level"
  | "suggest_next_actions"
  | "generate_pedagogical_explanation"
  // V2 — nouveaux domaines.
  | "assess_weather_impact"
  | "classify_acoustic_contact"
  | "check_area_proximity"
  | "assess_behavior_pattern";

/**
 * Résultat standard d'une skill analytique. Forme commune renvoyée par la
 * plupart des skills (`suggest_next_actions` et
 * `generate_pedagogical_explanation` ont des signatures dédiées).
 */
export type SkillResult = {
  skill: SkillName;
  summary: string;
  /** Confiance 0..1. */
  confidence: number;
  flags: SkillFlag[];
  recommendedAction: string;
};
