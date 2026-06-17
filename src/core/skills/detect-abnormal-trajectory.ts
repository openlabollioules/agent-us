import type { ContactFlag, ContactTrack, SkillResult } from "@/types";

/** Drapeaux considérés comme des comportements de trajectoire anormaux. */
const ABNORMAL_FLAGS: ContactFlag[] = [
  "constant_distance_following",
  "ais_route_mismatch",
  "trajectory_anomaly",
];

/**
 * detect_abnormal_trajectory — détecte un comportement de mouvement inhabituel.
 * Une anomalie est un indicateur, pas une preuve.
 *
 * (Correction du plan : on conserve les drapeaux précis détectés au lieu de les
 * écraser par un `trajectory_anomaly` générique.)
 */
export function detectAbnormalTrajectory(contact: ContactTrack): SkillResult {
  const matched = contact.flags.filter((flag) => ABNORMAL_FLAGS.includes(flag));
  const abnormal = matched.length > 0;

  return {
    skill: "detect_abnormal_trajectory",
    summary: abnormal
      ? `Le contact ${contact.id} présente un comportement inhabituel : ${matched.join(", ")}.`
      : `Aucune anomalie de trajectoire significative pour ${contact.id}.`,
    confidence: abnormal ? 0.78 : 0.55,
    flags: matched,
    recommendedAction: abnormal
      ? "Comparer avec l'AIS et demander une synthèse de suspicion."
      : "Continuer la surveillance.",
  };
}
