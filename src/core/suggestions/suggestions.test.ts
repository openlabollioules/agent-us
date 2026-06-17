import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import type { ScenarioDefinition, TacticalState } from "@/types";
import {
  MAX_SUGGESTIONS,
  applySuggestions,
  computeSuggestions,
} from "./suggestion-engine";

function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-sugg");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");

describe("computeSuggestions", () => {
  it("ne propose rien tant qu'aucun indice exploitable n'est apparu", () => {
    const state = createInitialState(drone, "sim");
    expect(computeSuggestions(state)).toEqual([]);
  });

  it("propose des actions une fois les indices révélés (les suggestions changent)", () => {
    const early = computeSuggestions(createInitialState(drone, "sim"));
    const late = computeSuggestions(runUntil(drone, drone.maxTurns));
    expect(late.length).toBeGreaterThan(early.length);
  });

  it("ne dépasse jamais la limite et garde des identifiants uniques", () => {
    const actions = computeSuggestions(runUntil(drone, drone.maxTurns));
    expect(actions.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
    const ids = actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("trie par priorité (high avant medium)", () => {
    const actions = computeSuggestions(runUntil(drone, drone.maxTurns));
    const ranks = actions.map((a) =>
      a.priority === "high" ? 0 : a.priority === "medium" ? 1 : 2,
    );
    const sorted = [...ranks].sort((x, y) => x - y);
    expect(ranks).toEqual(sorted);
    expect(actions[0]!.priority).toBe("high");
  });

  it("propose de réduire l'incertitude sur une fausse alerte (scénario 3)", () => {
    const actions = computeSuggestions(runUntil(getScenario("radar-loss"), 5));
    expect(actions.some((a) => a.id.startsWith("reduce-uncertainty"))).toBe(true);
  });
});

describe("applySuggestions", () => {
  it("écrit les suggestions dans l'état sans le muter", () => {
    const state = runUntil(drone, drone.maxTurns);
    const before = JSON.stringify(state);
    const next = applySuggestions(state);
    expect(next.suggestedActions.length).toBeGreaterThan(0);
    expect(JSON.stringify(state)).toBe(before);
  });
});
