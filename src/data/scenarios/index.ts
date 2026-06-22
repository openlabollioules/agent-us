import type { ScenarioDefinition, ScenarioMeta } from "@/types";
import { droneFollowingCargo } from "./drone-following-cargo";
import { aisRouteMismatch } from "./ais-route-mismatch";
import { radarLoss } from "./radar-loss";
import { weatherFalsePositive } from "./weather-false-positive";
import { fishingVesselAmbiguous } from "./fishing-vessel-ambiguous";
import { droneNearSensitiveArea } from "./drone-near-sensitive-area";
import { submarineContact } from "./submarine-contact";
import { dualAnomaly } from "./dual-anomaly";

/** Tous les scénarios, dans l'ordre d'affichage (V1 puis V2). */
export const SCENARIOS: ScenarioDefinition[] = [
  // V1
  droneFollowingCargo,
  aisRouteMismatch,
  radarLoss,
  // V2
  weatherFalsePositive,
  fishingVesselAmbiguous,
  droneNearSensitiveArea,
  submarineContact,
  dualAnomaly,
];

const SCENARIOS_BY_ID = new Map<string, ScenarioDefinition>(
  SCENARIOS.map((scenario) => [scenario.id, scenario]),
);

export type ScenarioId = (typeof SCENARIOS)[number]["id"];

/** Récupère un scénario par identifiant (throw si inconnu). */
export function getScenario(id: string): ScenarioDefinition {
  const scenario = SCENARIOS_BY_ID.get(id);
  if (!scenario) {
    throw new Error(`Scénario inconnu : ${id}`);
  }
  return scenario;
}

/** Liste légère pour le sélecteur de scénarios (sans timeline). */
export function listScenarioMeta(): ScenarioMeta[] {
  return SCENARIOS.map(({ id, title, difficulty, objective, estimatedMinutes }) => ({
    id,
    title,
    difficulty,
    objective,
    estimatedMinutes,
  }));
}

export { droneFollowingCargo, aisRouteMismatch, radarLoss };
export {
  weatherFalsePositive,
  fishingVesselAmbiguous,
  droneNearSensitiveArea,
  submarineContact,
  dualAnomaly,
};
