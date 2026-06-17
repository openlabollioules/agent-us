import type { AgentMessage, TacticalState } from "@/types";
import { radarMcp } from "@/core/mcp";
import { detectContact, trackContact } from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/** RadarAgent — rapporte les contacts radar et leur stabilité. */
export class RadarAgent extends BaseAgent {
  constructor() {
    super(AGENT_DEFINITIONS["radar-agent"]);
  }

  analyze(state: TacticalState, contactId: string): AgentMessage | null {
    const contact = state.contacts.find((c) => c.id === contactId);
    if (!contact) return null;

    const observation = radarMcp.getObservation(state, contactId);
    const detect = detectContact(observation);
    const track = trackContact(contact);

    return this.makeMessage(
      state,
      {
        message: `${detect.summary} ${track.summary}`,
        confidence: detect.confidence,
        usedSkills: ["detect_contact", "track_contact"],
      },
      contactId,
    );
  }
}
