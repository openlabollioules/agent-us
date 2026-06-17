import type { ScenarioDefinition, TacticalEvent } from "@/types";
import { toPublicEvent } from "@/core/simulation";

/**
 * ScenarioMCP — fournit les événements scénarisés d'un tour donné, sous leur
 * forme publique (sans les `effects` internes au moteur).
 */
export class ScenarioMCP {
  getEventsForTurn(
    scenario: ScenarioDefinition,
    turn: number,
  ): TacticalEvent[] {
    return scenario.timeline
      .filter((event) => event.turn === turn)
      .map(toPublicEvent);
  }
}
