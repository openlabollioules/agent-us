import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import type { ScenarioDefinition, TacticalState } from "@/types";
import { applyVisualFocus, computeVisualFocus } from "./visual-attention-engine";

function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-focus");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");

describe("computeVisualFocus", () => {
  it("ne renvoie aucun focus au tour 0 (événement mission sans contact)", () => {
    const state = createInitialState(drone, "sim");
    expect(computeVisualFocus(state)).toBeUndefined();
  });

  it("suit le dernier événement quand aucun contact n'est très suspect", () => {
    const state = runUntil(drone, 2); // C-042 détecté, suspicion encore faible
    const focus = computeVisualFocus(state)!;
    expect(focus.contactIds).toContain("C-042");
    expect(focus.reason.length).toBeGreaterThan(0);
  });

  it("zoome (close) sur un événement de forte sévérité", () => {
    const state = runUntil(getScenario("ais-route-mismatch"), 5); // event ais_mismatch high
    const focus = computeVisualFocus(state)!;
    expect(focus.contactIds).toContain("C-014");
    expect(focus.zoom).toBe(1.5);
  });

  it("priorise le contact le plus suspect et affiche ses relations", () => {
    const state = runUntil(drone, drone.maxTurns);
    const focus = computeVisualFocus(state)!;
    expect(focus.contactIds).toContain("C-042");
    expect(focus.contactIds).toContain("C-001"); // relation cible
    expect(focus.showRelationLines).toBe(true);
    expect(focus.showTrajectories).toBe(true);
    expect(focus.center).toEqual(
      state.contacts.find((c) => c.id === "C-042")!.position,
    );
  });
});

describe("applyVisualFocus", () => {
  it("écrit le focus dans l'état sans le muter", () => {
    const state = runUntil(drone, drone.maxTurns);
    const before = JSON.stringify(state);
    const next = applyVisualFocus(state);
    expect(next.visualFocus).toBeDefined();
    expect(JSON.stringify(state)).toBe(before);
  });
});
