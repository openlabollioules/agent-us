import type { AgentMessage, TacticalState } from "@/types";
import { aisMcp } from "@/core/mcp";
import { compareAisRoute, detectAbnormalTrajectory } from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/** NavigationAgent — analyse trajectoires et cohérence AIS. */
export class NavigationAgent extends BaseAgent {
  constructor() {
    super(AGENT_DEFINITIONS["navigation-agent"]);
  }

  analyze(state: TacticalState, contactId: string): AgentMessage | null {
    const contact = state.contacts.find((c) => c.id === contactId);
    if (!contact) return null;

    const ais = aisMcp.getAISData(state, contactId);
    const route = compareAisRoute(contact, ais);
    const trajectory = detectAbnormalTrajectory(contact);

    return this.makeMessage(
      state,
      {
        message: `${route.summary} ${trajectory.summary}`,
        confidence: Math.max(route.confidence, trajectory.confidence),
        usedSkills: ["compare_ais_route", "detect_abnormal_trajectory"],
      },
      contactId,
    );
  }
}
