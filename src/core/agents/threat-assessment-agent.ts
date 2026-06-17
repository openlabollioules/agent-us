import type { AgentMessage, TacticalState } from "@/types";
import {
  estimateThreatLevel,
  generatePedagogicalExplanation,
} from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/**
 * ThreatAssessmentAgent — fusionne les observations en un niveau de suspicion
 * pédagogique. Ne recommande jamais d'action offensive ; l'humain décide.
 */
export class ThreatAssessmentAgent extends BaseAgent {
  constructor() {
    super(AGENT_DEFINITIONS["threat-assessment-agent"]);
  }

  analyze(state: TacticalState, contactId: string): AgentMessage | null {
    const contact = state.contacts.find((c) => c.id === contactId);
    if (!contact) return null;

    const threat = estimateThreatLevel(contact);
    const explanation = generatePedagogicalExplanation(contact);

    return this.makeMessage(
      state,
      {
        message: `${threat.summary} ${explanation}`,
        confidence: threat.confidence,
        usedSkills: ["estimate_threat_level", "generate_pedagogical_explanation"],
      },
      contactId,
    );
  }
}
