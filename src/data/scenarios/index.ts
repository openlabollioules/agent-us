import type { ScenarioDefinition, ScenarioMeta } from "@/types";
import { droneFollowingCargo } from "./drone-following-cargo";
import { aisRouteMismatch } from "./ais-route-mismatch";
import { radarLoss } from "./radar-loss";

/** Tous les scénarios V1, dans l'ordre d'affichage. */
export const SCENARIOS: ScenarioDefinition[] = [
  droneFollowingCargo,
  aisRouteMismatch,
  radarLoss,
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
