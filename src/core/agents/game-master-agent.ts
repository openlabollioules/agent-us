import type {
  AgentMessage,
  ScenarioDefinition,
  TacticalState,
} from "@/types";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/**
 * GameMasterAgent — orchestrateur narratif. Présente la mission et raconte la
 * situation en s'appuyant sur les événements de TacticalState. Ne recommande
 * jamais d'action offensive et garde l'humain dans la boucle.
 */
export class GameMasterAgent extends BaseAgent {
  constructor() {
    super(AGENT_DEFINITIONS["game-master-agent"]);
  }

  /** Message d'introduction présentant le briefing du scénario. */
  present(state: TacticalState, scenario: ScenarioDefinition): AgentMessage {
    return this.makeMessage(state, {
      message: scenario.briefing,
      usedSkills: [],
    });
  }

  /** Raconte l'événement le plus récent (éventuellement filtré sur un contact). */
  analyze(state: TacticalState, contactId?: string): AgentMessage | null {
    const event = contactId
      ? [...state.events].reverse().find((e) => e.contactId === contactId)
      : state.events.at(-1);

    if (!event) return null;

    return this.makeMessage(
      state,
      {
        message: `${event.title} — ${event.description}`,
        referencedContacts: event.contactId ? [event.contactId] : [],
        usedSkills: [],
      },
      event.contactId,
    );
  }
}
