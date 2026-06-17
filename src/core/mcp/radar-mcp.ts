import type { RadarObservation, TacticalState, Vec2 } from "@/types";
import { round2 } from "@/core/simulation";
import { findContact } from "./util";

/** Position fictive du capteur radar (centre de la zone surveillée). */
const SENSOR_ORIGIN: Vec2 = { x: 500, y: 500 };

/** Conversion d'unités carte → milles nautiques (échelle fictive). */
const NM_PER_UNIT = 0.05;

/** Relèvement nautique (0°=Nord, 90°=Est) du capteur vers une position. */
function bearingDeg(from: Vec2, to: Vec2): number {
  const deg = (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI;
  return round2((deg + 360) % 360);
}

/**
 * RadarMCP — source de données radar simulée. Toutes les valeurs sont dérivées
 * de TacticalState (rien n'est inventé) : la distance et le relèvement viennent
 * de la position du contact, le statut de ses drapeaux et de sa confiance.
 */
export class RadarMCP {
  getObservation(state: TacticalState, contactId: string): RadarObservation {
    const contact = findContact(state, contactId);
    const rangeNm = round2(
      Math.hypot(
        contact.position.x - SENSOR_ORIGIN.x,
        contact.position.y - SENSOR_ORIGIN.y,
      ) * NM_PER_UNIT,
    );

    return {
      contactId: contact.id,
      rangeNm,
      bearingDeg: bearingDeg(SENSOR_ORIGIN, contact.position),
      speedKnots: contact.speedKnots,
      radarConfidence: contact.radarConfidence,
      radarStatus: contact.flags.includes("radar_contact_lost")
        ? "lost"
        : contact.radarConfidence < 0.5
          ? "unstable"
          : "tracked",
    };
  }
}
