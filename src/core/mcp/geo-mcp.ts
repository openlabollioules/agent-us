import type { AreaProximityReport, TacticalState } from "@/types";
import { round2 } from "@/core/simulation";
import { findContact } from "./util";

/** Marge (unités carte) au-delà du bord d'une zone considérée comme "proche". */
const NEAR_MARGIN = 80;

/**
 * GeoMCP — calcule la proximité d'un contact vis-à-vis des zones sensibles
 * (`state.sensitiveAreas`). Géométrie pure et déterministe : distance euclidienne
 * du contact au centre, comparée au rayon de la zone. Sans zone, rien n'est proche.
 */
export class GeoMCP {
  getProximity(state: TacticalState, contactId: string): AreaProximityReport {
    const contact = findContact(state, contactId);
    const areas = state.sensitiveAreas ?? [];

    if (areas.length === 0) {
      return {
        contactId,
        distanceToEdgeUnits: Infinity,
        isInside: false,
        isNear: false,
      };
    }

    // Zone dont le bord est le plus proche du contact.
    let nearest = areas[0]!;
    let nearestEdge = Infinity;
    for (const area of areas) {
      const distToCenter = Math.hypot(
        contact.position.x - area.area.center.x,
        contact.position.y - area.area.center.y,
      );
      const distToEdge = distToCenter - area.area.radiusUnits;
      if (distToEdge < nearestEdge) {
        nearestEdge = distToEdge;
        nearest = area;
      }
    }

    return {
      contactId,
      nearestAreaId: nearest.id,
      nearestAreaLabel: nearest.label,
      distanceToEdgeUnits: round2(nearestEdge),
      isInside: nearestEdge <= 0,
      isNear: nearestEdge <= NEAR_MARGIN,
    };
  }
}
