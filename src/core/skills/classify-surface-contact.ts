import type { OptronicObservation, SkillResult } from "@/types";

/**
 * classify_surface_contact — classe un objet maritime à partir d'une
 * observation visuelle/thermique. La classification reste probabiliste et
 * mentionne la qualité d'image.
 */
export function classifySurfaceContact(
  obs: OptronicObservation,
): SkillResult {
  const lowQuality = obs.imageQuality < 0.5;

  return {
    skill: "classify_surface_contact",
    summary: `Classification probable pour ${obs.contactId} : ${obs.classificationHint}. Qualité d'image : ${Math.round(obs.imageQuality * 100)} %.`,
    confidence: obs.imageQuality,
    flags:
      obs.classificationHint === "small_surface_object"
        ? ["small_object_near_civilian"]
        : [],
    recommendedAction: lowQuality
      ? "Continuer le suivi et demander une nouvelle observation."
      : "Utiliser cette classification dans la synthèse de suspicion.",
  };
}
