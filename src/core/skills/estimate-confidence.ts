import type { SkillResult } from "@/types";
import { round2 } from "@/core/simulation";

/**
 * estimate_confidence — combine plusieurs niveaux de confiance capteur.
 * Une confiance faible doit déclencher un croisement de sources.
 *
 * (Correction du plan : le drapeau `low_confidence` est un drapeau d'analyse
 * valide — `AnalysisFlag` — et non un `ContactFlag` invalide.)
 */
export function estimateConfidence(values: number[]): SkillResult {
  if (values.length === 0) {
    return {
      skill: "estimate_confidence",
      summary: "Aucune valeur de confiance disponible.",
      confidence: 0,
      flags: [],
      recommendedAction: "Recueillir davantage d'observations.",
    };
  }

  const average = round2(values.reduce((a, b) => a + b, 0) / values.length);
  const low = average < 0.5;

  return {
    skill: "estimate_confidence",
    summary: `Confiance combinée : ${Math.round(average * 100)} %.`,
    confidence: average,
    flags: low ? ["low_confidence"] : [],
    recommendedAction: low
      ? "Demander une confirmation croisée entre capteurs."
      : "Utiliser cette confiance dans l'évaluation.",
  };
}
