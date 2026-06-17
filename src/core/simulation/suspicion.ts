import type { ContactFlag, ContactTrack } from "@/types";
import { round2 } from "./movement";

/**
 * Poids de chaque drapeau dans le score de suspicion (0..1).
 *
 * `possible_false_positive` a un poids NÉGATIF : une fausse alerte plausible
 * doit faire *baisser* la suspicion (cf. scénario "perte radar ambiguë"), pour
 * enseigner qu'une anomalie n'est pas une menace.
 */
export const SUSPICION_FLAG_WEIGHTS: Record<ContactFlag, number> = {
  constant_distance_following: 0.4,
  ais_route_mismatch: 0.35,
  trajectory_anomaly: 0.2,
  small_object_near_civilian: 0.15,
  radar_contact_lost: 0.15,
  ais_missing: 0.1,
  low_radar_confidence: 0.1,
  optronic_confirmation_needed: 0.05,
  possible_false_positive: -0.4,
};

/**
 * Calcule un score de suspicion déterministe à partir des drapeaux d'un contact.
 * Un contact ami n'est jamais suspect.
 */
export function computeSuspicion(
  contact: Pick<ContactTrack, "flags" | "affiliation">,
): number {
  if (contact.affiliation === "friendly") return 0;

  const raw = contact.flags.reduce(
    (sum, flag) => sum + (SUSPICION_FLAG_WEIGHTS[flag] ?? 0),
    0,
  );

  return round2(Math.min(1, Math.max(0, raw)));
}
