import { describe, expect, it } from "vitest";
import type { TacticalState } from "@/types";
import { SimulationController } from "./simulation-controller";

const controller = new SimulationController();

/** Joue un scénario complet jusqu'à awaiting_player. */
function playToEnd(scenarioId: string): TacticalState {
  let state = controller.start(scenarioId, "sim-ctrl");
  while (state.status === "running") {
    state = controller.step(state);
  }
  return state;
}

describe("SimulationController.start", () => {
  it("initialise l'état avec le briefing du GameMaster", () => {
    const state = controller.start("drone-following-cargo", "sim");
    expect(state.turn).toBe(0);
    expect(state.status).toBe("running");
    expect(state.agentMessages).toHaveLength(1);
    expect(state.agentMessages[0]!.agentId).toBe("game-master-agent");
  });
});

describe("SimulationController.step", () => {
  it("avance le tour et fait commenter les agents sur les événements", () => {
    const start = controller.start("drone-following-cargo", "sim");
    const next = controller.step(start);
    expect(next.turn).toBe(1);
    // Au tour 1, un contact est détecté → au moins un commentaire d'agent.
    expect(next.agentMessages.length).toBeGreaterThan(start.agentMessages.length);
  });

  it("déroule jusqu'à awaiting_player et met C-042 en évidence", () => {
    const end = playToEnd("drone-following-cargo");
    expect(end.status).toBe("awaiting_player");
    const c042 = end.contacts.find((c) => c.id === "C-042")!;
    expect(c042.isHighlighted).toBe(true);
    expect(end.suggestedActions.length).toBeGreaterThan(0);
    expect(end.visualFocus?.contactIds).toContain("C-042");
  });

  it("est déterministe sur une partie complète", () => {
    expect(JSON.stringify(playToEnd("drone-following-cargo"))).toBe(
      JSON.stringify(playToEnd("drone-following-cargo")),
    );
  });
});

describe("SimulationController.runInstruction / runSuggestedAction", () => {
  it("ajoute une réponse d'agent et recalcule suggestions + focus", () => {
    const end = playToEnd("drone-following-cargo");
    const after = controller.runInstruction(
      end,
      "NavigationAgent, est-ce que C-042 suit le cargo ?",
    );
    expect(after.agentMessages.length).toBe(end.agentMessages.length + 1);
    expect(after.playerActions).toHaveLength(1);
  });

  it("exécute une action suggérée", () => {
    const end = playToEnd("drone-following-cargo");
    const action = end.suggestedActions[0]!;
    const after = controller.runSuggestedAction(end, action);
    expect(after.playerActions[0]!.type).toBe("suggested_action");
  });
});

describe("SimulationController.diagnose", () => {
  it("renvoie score + débrief et marque la partie terminée", () => {
    const end = playToEnd("drone-following-cargo");
    const { state, score, debrief } = controller.diagnose(end, {
      contactId: "C-042",
      anomalyType: "discreet_following",
      justification:
        "Trajectoire parallèle, distance constante et signature faible.",
      playerConfidence: 0.8,
    });
    expect(state.status).toBe("completed");
    expect(state.diagnosis?.contactId).toBe("C-042");
    expect(score.passed).toBe(true);
    expect(debrief.scenarioTitle.length).toBeGreaterThan(0);
  });
});
