import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import { suggestNextActions } from "@/core/skills";
import type { ScenarioDefinition, TacticalState } from "@/types";
import { AgentRuntime } from "./agent-runtime";
import { detectAgent, detectContact, pickContact } from "./routing";

function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-runtime");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");
const runtime = new AgentRuntime();

describe("routing", () => {
  it("détecte un agent nommé explicitement", () => {
    expect(detectAgent("NavigationAgent, que penses-tu de C-042 ?")).toBe(
      "navigation-agent",
    );
    expect(detectAgent("RadarAgent, la piste est-elle stable ?")).toBe(
      "radar-agent",
    );
  });

  it("détecte un agent par mot-clé thématique", () => {
    expect(detectAgent("compare la route AIS")).toBe("navigation-agent");
    expect(detectAgent("quelle est la suspicion ?")).toBe(
      "threat-assessment-agent",
    );
  });

  it("renvoie null si aucun agent n'est identifié", () => {
    expect(detectAgent("bonjour tout le monde")).toBeNull();
  });

  it("détecte un contact mentionné sous diverses formes", () => {
    const state = createInitialState(drone, "sim");
    expect(detectContact("regarde C-042", state)).toBe("C-042");
    expect(detectContact("et c042 alors ?", state)).toBe("C-042");
    expect(detectContact("rien ici", state)).toBeUndefined();
  });

  it("choisit le contact le plus suspect par défaut", () => {
    const state = runUntil(drone, drone.maxTurns);
    expect(pickContact(state)).toBe("C-042");
  });
});

describe("AgentRuntime.runInstruction", () => {
  it("route vers l'agent nommé et répond sur le contact mentionné", () => {
    const state = runUntil(drone, 5);
    const next = runtime.runInstruction(
      state,
      "NavigationAgent, est-ce que C-042 suit le cargo ?",
    );

    expect(next.agentMessages).toHaveLength(1);
    expect(next.playerActions).toHaveLength(1);

    const msg = next.agentMessages[0]!;
    expect(msg.agentId).toBe("navigation-agent");
    expect(msg.referencedContacts).toContain("C-042");

    const action = next.playerActions[0]!;
    expect(action.type).toBe("free_instruction");
    expect(action.targetAgentId).toBe("navigation-agent");
  });

  it("route vers le GameMaster si aucun agent n'est identifié", () => {
    const state = runUntil(drone, 2);
    const next = runtime.runInstruction(state, "que se passe-t-il ?");
    expect(next.agentMessages[0]!.agentId).toBe("game-master-agent");
  });

  it("produit des identifiants de message uniques sur le même tour", () => {
    let state = runUntil(drone, 5);
    state = runtime.runInstruction(state, "RadarAgent, analyse C-042");
    state = runtime.runInstruction(state, "RadarAgent, analyse C-042");
    const ids = state.agentMessages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ne mute pas l'état d'entrée", () => {
    const state = runUntil(drone, 5);
    const before = JSON.stringify(state);
    runtime.runInstruction(state, "RadarAgent, analyse C-042");
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe("AgentRuntime.runSuggestedAction", () => {
  it("exécute une suggestion vers son agent et son contact", () => {
    const state = runUntil(drone, drone.maxTurns);
    const action = suggestNextActions(state).find(
      (a) => a.skillName === "classify_surface_contact",
    )!;
    const next = runtime.runSuggestedAction(state, action);

    const msg = next.agentMessages[0]!;
    expect(msg.agentId).toBe("optronic-agent");
    expect(msg.referencedContacts).toContain("C-042");

    const recorded = next.playerActions[0]!;
    expect(recorded.type).toBe("suggested_action");
    expect(recorded.skillName).toBe("classify_surface_contact");
  });
});

describe("groundedness", () => {
  it("la réponse Navigation sur C-014 mentionne l'AIS (issue de l'état)", () => {
    const state = runUntil(getScenario("ais-route-mismatch"), 6);
    const next = runtime.runInstruction(state, "NavigationAgent, et C-014 ?");
    expect(next.agentMessages[0]!.message).toMatch(/AIS/i);
  });
});
