import type { AreaProximityReport, SkillResult } from "@/types";

/**
 * check_area_proximity — qualifie la position d'un contact par rapport aux zones
 * sensibles. Être proche ou à l'intérieur n'est pas une preuve, mais un contact
 * qui s'attarde au bord d'une zone sensible justifie une surveillance accrue.
 */
export function checkAreaProximity(report: AreaProximityReport): SkillResult {
  if (!report.nearestAreaId) {
    return {
      skill: "check_area_proximity",
      summary: `Aucune zone sensible à proximité de ${report.contactId}.`,
      confidence: 1,
      flags: [],
      recommendedAction: "Surveillance standard.",
    };
  }

  const where = report.isInside
    ? `à l'intérieur de la zone « ${report.nearestAreaLabel} »`
    : report.isNear
      ? `à ${report.distanceToEdgeUnits} unités du bord de la zone « ${report.nearestAreaLabel} »`
      : `à distance de la zone « ${report.nearestAreaLabel} »`;

  return {
    skill: "check_area_proximity",
    summary: `${report.contactId} se trouve ${where}.`,
    confidence: 0.7,
    flags: report.isNear ? ["near_sensitive_area"] : [],
    recommendedAction:
      report.isInside || report.isNear
        ? "Vérifier s'il transite ou s'il s'attarde (loitering) au bord de la zone."
        : "Pas de proximité préoccupante pour l'instant.",
  };
}
