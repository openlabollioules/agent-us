import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { createInitialState } from "@/core/simulation";
import type { PlayerAction, PlayerDiagnosis, TacticalState } from "@/types";
import { buildDebrief, scoreDiagnosis } from "./scoring-engine";

const drone = getScenario("drone-following-cargo");

function diag(overrides: Partial<PlayerDiagnosis> = {}): PlayerDiagnosis {
  return {
    contactId: "C-042",
    anomalyType: "discreet_following",
    justification:
      "Trajectoire parallèle et distance constante avec le cargo, signature radar faible.",
    playerConfidence: 0.8,
    ...overrides,
  };
}

function stateWithActions(skills: string[]): TacticalState {
  const base = createInitialState(drone, "sim-score");
  const playerActions: PlayerAction[] = skills.map((skillName, i) => ({
    id: `pa-${i}`,
    turn: 1,
    type: "suggested_action",
    instruction: skillName,
    targetAgentId: "navigation-agent",
    skillName,
  }));
  return { ...base, playerActions };
}

describe("scoreDiagnosis", () => {
  it("récompense un diagnostic correct (contact + anomalie + justification)", () => {
    const result = scoreDiagnosis(diag(), drone, createInitialState(drone, "s"));
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("échoue si le type d'anomalie est faux", () => {
    const result = scoreDiagnosis(
      diag({ anomalyType: "ais_route_mismatch" }),
      drone,
      createInitialState(drone, "s"),
    );
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(70);
  });

  it("échoue si le mauvais contact est désigné", () => {
    const result = scoreDiagnosis(
      diag({ contactId: "C-001" }),
      drone,
      createInitialState(drone, "s"),
    );
    expect(result.passed).toBe(false);
  });

  it("valide la fausse alerte du scénario 3 (sensor_uncertainty)", () => {
    const radar = getScenario("radar-loss");
    const result = scoreDiagnosis(
      diag({ contactId: "C-030", anomalyType: "sensor_uncertainty" }),
      radar,
      createInitialState(radar, "s"),
    );
    expect(result.passed).toBe(true);
  });

  it("ajoute un bonus borné pour les actions d'investigation utiles", () => {
    const result = scoreDiagnosis(
      diag(),
      drone,
      stateWithActions([
        "compare_ais_route",
        "classify_surface_contact",
        "estimate_threat_level",
      ]),
    );
    // 40 + 30 + 10 + min(20, 3*7) = 100
    expect(result.score).toBe(100);
  });

  it("liste les indices clés non mentionnés dans la justification", () => {
    const result = scoreDiagnosis(
      diag({ justification: "Court." }),
      drone,
      createInitialState(drone, "s"),
    );
    expect(result.missedEvidence.length).toBeGreaterThan(0);
  });
});

describe("buildDebrief", () => {
  it("construit un débrief complet et cohérent", () => {
    const state = stateWithActions(["classify_surface_contact"]);
    const score = scoreDiagnosis(diag(), drone, state);
    const debrief = buildDebrief(diag(), drone, state, score);

    expect(debrief.scenarioTitle).toBe(drone.title);
    expect(debrief.contactCorrect).toBe(true);
    expect(debrief.anomalyCorrect).toBe(true);
    expect(debrief.usefulSkills).toContain("classify_surface_contact");
    expect(debrief.explanation).toBe(drone.debriefExplanation);
    expect(debrief.pedagogicalGoals.length).toBeGreaterThan(0);
  });
});
