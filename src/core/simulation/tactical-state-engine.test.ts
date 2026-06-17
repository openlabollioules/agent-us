import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import type { ScenarioDefinition, TacticalState } from "@/types";
import { advanceTurn, createInitialState } from "./tactical-state-engine";
import { MAP_SIZE } from "./constants";

const droneScenario = getScenario("drone-following-cargo");

/** Déroule un scénario jusqu'à son dernier tour. */
function runToEnd(scenario: ScenarioDefinition): TacticalState {
  let state = createInitialState(scenario, "sim-test");
  while (state.turn < scenario.maxTurns) {
    state = advanceTurn(state, scenario);
  }
  return state;
}

describe("createInitialState", () => {
  it("crée un état valide au tour 0", () => {
    const state = createInitialState(droneScenario, "sim-1");
    expect(state.turn).toBe(0);
    expect(state.status).toBe("running");
    expect(state.scenarioId).toBe("drone-following-cargo");
    expect(state.contacts).toHaveLength(2);
    expect(state.events[0]?.type).toBe("mission_started");
  });

  it("initialise chaque contact avec un point d'historique", () => {
    const state = createInitialState(droneScenario, "sim-1");
    for (const contact of state.contacts) {
      expect(contact.history).toHaveLength(1);
      expect(contact.history[0]?.turn).toBe(0);
    }
  });
});

describe("advanceTurn", () => {
  it("incrémente le tour et enregistre l'historique", () => {
    const initial = createInitialState(droneScenario, "sim-1");
    const next = advanceTurn(initial, droneScenario);
    expect(next.turn).toBe(1);
    for (const contact of next.contacts) {
      expect(contact.history).toHaveLength(2);
      expect(contact.history.at(-1)?.turn).toBe(1);
    }
  });

  it("ne mute pas l'état d'entrée (pureté)", () => {
    const initial = createInitialState(droneScenario, "sim-1");
    const before = JSON.stringify(initial);
    advanceTurn(initial, droneScenario);
    expect(JSON.stringify(initial)).toBe(before);
  });

  it("est déterministe (même entrée → même sortie)", () => {
    const a = runToEnd(droneScenario);
    const b = runToEnd(droneScenario);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("passe en awaiting_player au dernier tour et n'avance plus ensuite", () => {
    const end = runToEnd(droneScenario);
    expect(end.turn).toBe(droneScenario.maxTurns);
    expect(end.status).toBe("awaiting_player");
    const stuck = advanceTurn(end, droneScenario);
    expect(stuck.turn).toBe(end.turn);
  });

  it("garde tous les contacts dans les limites de la carte", () => {
    let state = createInitialState(droneScenario, "sim-1");
    while (state.turn < droneScenario.maxTurns) {
      state = advanceTurn(state, droneScenario);
      for (const c of state.contacts) {
        expect(c.position.x).toBeGreaterThanOrEqual(0);
        expect(c.position.x).toBeLessThanOrEqual(MAP_SIZE);
        expect(c.position.y).toBeGreaterThanOrEqual(0);
        expect(c.position.y).toBeLessThanOrEqual(MAP_SIZE);
      }
    }
  });

  it("publie les événements scénarisés sans champ effects", () => {
    const end = runToEnd(droneScenario);
    const published = end.events.filter((e) => e.turn > 0);
    expect(published.length).toBeGreaterThan(0);
    for (const event of published) {
      expect(event).not.toHaveProperty("effects");
    }
  });
});

describe("résultats par scénario", () => {
  it("scénario 1 : le suiveur (C-042) devient fortement suspect", () => {
    const end = runToEnd(droneScenario);
    const c042 = end.contacts.find((c) => c.id === "C-042")!;
    expect(c042.flags).toContain("constant_distance_following");
    expect(c042.suspicionScore).toBeGreaterThanOrEqual(0.65);
    expect(c042.isHighlighted).toBe(true);
    expect(c042.relationTargetId).toBe("C-001");
  });

  it("scénario 2 : le cargo (C-014) présente une incohérence AIS", () => {
    const end = runToEnd(getScenario("ais-route-mismatch"));
    const c014 = end.contacts.find((c) => c.id === "C-014")!;
    expect(c014.flags).toContain("ais_route_mismatch");
    expect(c014.suspicionScore).toBeGreaterThanOrEqual(0.4);
    // Le patrouilleur allié n'est jamais suspect.
    const patrol = end.contacts.find((c) => c.id === "C-100")!;
    expect(patrol.suspicionScore).toBe(0);
  });

  it("scénario 3 : la fausse alerte (C-030) retombe à une suspicion faible", () => {
    const end = runToEnd(getScenario("radar-loss"));
    const c030 = end.contacts.find((c) => c.id === "C-030")!;
    expect(c030.flags).toContain("possible_false_positive");
    expect(c030.flags).not.toContain("radar_contact_lost");
    expect(c030.suspicionScore).toBeLessThan(0.4);
    expect(c030.isHighlighted).toBe(false);
  });
});
