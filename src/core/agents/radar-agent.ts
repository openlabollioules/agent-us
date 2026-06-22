import type { AgentMessage, SkillName, TacticalState } from "@/types";
import { acousticMcp, radarMcp, weatherMcp } from "@/core/mcp";
import {
  assessWeatherImpact,
  classifyAcousticContact,
  detectContact,
  trackContact,
} from "@/core/skills";
import { BaseAgent } from "./base-agent";
import { AGENT_DEFINITIONS } from "./definitions";

/**
 * RadarAgent — rapporte les contacts radar et leur stabilité. En V2, il relie
 * aussi une anomalie de piste à la météo capteur et signale une piste acoustique
 * corrélée (le tout reste grounded sur l'état).
 */
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

    const parts = [detect.summary, track.summary];
    const usedSkills: SkillName[] = ["detect_contact", "track_contact"];

    // V2 — la météo dégrade-t-elle les capteurs au point d'expliquer l'anomalie ?
    const weather = weatherMcp.getReport(state);
    if (weather.degradesRadar) {
      parts.push(assessWeatherImpact(weather, contact).summary);
      usedSkills.push("assess_weather_impact");
    }

    // V2 — une piste acoustique est-elle corrélée à ce contact ?
    const acoustic = acousticMcp.getReportForContact(state, contactId);
    if (acoustic.hasTrack) {
      parts.push(classifyAcousticContact(acoustic).summary);
      usedSkills.push("classify_acoustic_contact");
    }

    return this.makeMessage(
      state,
      { message: parts.join(" "), confidence: detect.confidence, usedSkills },
      contactId,
    );
  }
}
