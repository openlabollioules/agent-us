import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import type { ScenarioDefinition, TacticalState } from "@/types";
import {
  AGENT_DEFINITIONS,
  ANALYST_AGENTS,
  gameMasterAgent,
  navigationAgent,
  optronicAgent,
  radarAgent,
  threatAssessmentAgent,
} from "./index";

function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-agent");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");

describe("définitions d'agents", () => {
  it("les skills déclarées correspondent aux définitions", () => {
    expect(AGENT_DEFINITIONS["radar-agent"].skills).toContain("detect_contact");
    expect(AGENT_DEFINITIONS["navigation-agent"].skills).toContain("compare_ais_route");
    expect(AGENT_DEFINITIONS["threat-assessment-agent"].mcps).toHaveLength(3);
  });
});

describe("agents analystes", () => {
  it("chaque agent renvoie null pour un contact inexistant", () => {
    const state = createInitialState(drone, "sim");
    for (const agent of ANALYST_AGENTS) {
      expect(agent.analyze(state, "C-999")).toBeNull();
    }
  });

  it("chaque agent produit un message cohérent pour un contact réel", () => {
    const state = runUntil(drone, drone.maxTurns);
    for (const agent of ANALYST_AGENTS) {
      const msg = agent.analyze(state, "C-042")!;
      expect(msg.message.length).toBeGreaterThan(0);
      expect(msg.referencedContacts).toContain("C-042");
      expect(msg.usedSkills.length).toBeGreaterThan(0);
      expect(msg.agentId).toBe(agent.definition.id);
      expect(msg.turn).toBe(state.turn);
    }
  });
});

describe("RadarAgent", () => {
  it("signale une piste instable / confiance faible sur C-042", () => {
    const state = runUntil(drone, 3);
    const msg = radarAgent.analyze(state, "C-042")!;
    expect(msg.message.toLowerCase()).toContain("confiance radar");
    expect(msg.usedSkills).toEqual(["detect_contact", "track_contact"]);
  });
});

describe("NavigationAgent", () => {
  it("détecte l'incohérence AIS de C-014", () => {
    const state = runUntil(getScenario("ais-route-mismatch"), 6);
    const msg = navigationAgent.analyze(state, "C-014")!;
    expect(msg.message).toMatch(/AIS/i);
    expect(msg.usedSkills).toContain("detect_abnormal_trajectory");
  });
});

describe("OptronicAgent", () => {
  it("classe C-042 comme petit objet de surface", () => {
    const state = createInitialState(drone, "sim");
    const msg = optronicAgent.analyze(state, "C-042")!;
    expect(msg.message).toMatch(/small_surface_object/);
    expect(msg.usedSkills).toEqual(["classify_surface_contact"]);
  });
});

describe("ThreatAssessmentAgent", () => {
  it("rapporte une suspicion élevée + explication pédagogique en fin de scénario", () => {
    const state = runUntil(drone, drone.maxTurns);
    const msg = threatAssessmentAgent.analyze(state, "C-042")!;
    expect(msg.message).toContain("élevé");
    expect(msg.message).toMatch(/suivi discret/i);
  });
});

describe("GameMasterAgent", () => {
  it("présente le briefing du scénario", () => {
    const state = createInitialState(drone, "sim");
    const msg = gameMasterAgent.present(state, drone);
    expect(msg.message).toBe(drone.briefing);
    expect(msg.agentId).toBe("game-master-agent");
  });

  it("raconte l'événement le plus récent", () => {
    const state = runUntil(drone, 2);
    const msg = gameMasterAgent.analyze(state)!;
    expect(msg.message.length).toBeGreaterThan(0);
  });
});

describe("déterminisme", () => {
  it("le même état produit exactement le même message", () => {
    const state = runUntil(drone, 5);
    const a = radarAgent.analyze(state, "C-042")!;
    const b = radarAgent.analyze(state, "C-042")!;
    expect(a).toEqual(b);
  });
});
