import type { AgentMessage, TacticalState } from "@/types";
import { optronicMcp } from "@/core/mcp";
import { classifySurfaceContact } from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/** OptronicAgent — décrit et classe un contact à partir de l'optronique. */
export class OptronicAgent extends BaseAgent {
  constructor() {
    super(AGENT_DEFINITIONS["optronic-agent"]);
  }

  analyze(state: TacticalState, contactId: string): AgentMessage | null {
    const contact = state.contacts.find((c) => c.id === contactId);
    if (!contact) return null;

    const observation = optronicMcp.getObservation(state, contactId);
    const classification = classifySurfaceContact(observation);

    return this.makeMessage(
      state,
      {
        message: `${classification.summary} ${classification.recommendedAction}`,
        confidence: classification.confidence,
        usedSkills: ["classify_surface_contact"],
      },
      contactId,
    );
  }
}
