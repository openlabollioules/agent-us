import type { AgentMessage, SkillName, TacticalState } from "@/types";
import { aisMcp, geoMcp } from "@/core/mcp";
import {
  assessBehaviorPattern,
  checkAreaProximity,
  compareAisRoute,
  detectAbnormalTrajectory,
} from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/**
 * NavigationAgent — analyse trajectoires et cohérence AIS. En V2, il qualifie
 * aussi la proximité d'une zone sensible et le profil de comportement déduit.
 */
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

    const parts = [route.summary, trajectory.summary];
    const usedSkills: SkillName[] = [
      "compare_ais_route",
      "detect_abnormal_trajectory",
    ];

    // V2 — proximité d'une zone sensible (si le scénario en déclare).
    const proximity = geoMcp.getProximity(state, contactId);
    if (proximity.isNear) {
      parts.push(checkAreaProximity(proximity).summary);
      usedSkills.push("check_area_proximity");
    }

    // V2 — profil de comportement déduit pour ce contact.
    const profile = state.behaviorProfiles?.find(
      (b) => b.contactId === contactId,
    );
    if (profile) {
      parts.push(assessBehaviorPattern(profile).summary);
      usedSkills.push("assess_behavior_pattern");
    }

    return this.makeMessage(
      state,
      {
        message: parts.join(" "),
        confidence: Math.max(route.confidence, trajectory.confidence),
        usedSkills,
      },
      contactId,
    );
  }
}
