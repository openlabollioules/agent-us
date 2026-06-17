import type { Vec2 } from "@/types";
import { MAP_SIZE, MOVEMENT_SCALE } from "./constants";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Déplace un contact d'un tour selon son cap (nautique : 0°=Nord, 90°=Est,
 * sens horaire) et sa vitesse. L'axe Y croît vers le bas (coordonnées écran),
 * donc le Nord correspond à -Y. La position résultante est bornée à la carte.
 */
export function nextPosition(
  position: Vec2,
  headingDeg: number,
  speedKnots: number,
): Vec2 {
  const rad = (headingDeg * Math.PI) / 180;
  const distance = speedKnots * MOVEMENT_SCALE;
  return {
    x: round2(clamp(position.x + Math.sin(rad) * distance, 0, MAP_SIZE)),
    y: round2(clamp(position.y - Math.cos(rad) * distance, 0, MAP_SIZE)),
  };
}
