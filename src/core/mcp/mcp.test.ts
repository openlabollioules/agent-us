import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import type { ScenarioDefinition, TacticalState } from "@/types";
import { aisMcp, optronicMcp, radarMcp, scenarioMcp } from "./index";

/** Déroule un scénario jusqu'à un tour donné. */
function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-mcp");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");

describe("RadarMCP", () => {
  it("dérive distance et relèvement de la position, statut tracked", () => {
    const state = createInitialState(drone, "sim");
    const obs = radarMcp.getObservation(state, "C-001");
    expect(obs.contactId).toBe("C-001");
    expect(obs.rangeNm).toBeGreaterThan(0);
    expect(obs.bearingDeg).toBeGreaterThanOrEqual(0);
    expect(obs.bearingDeg).toBeLessThan(360);
    expect(obs.radarStatus).toBe("tracked");
  });

  it("signale un statut unstable quand la confiance est faible", () => {
    const state = runUntil(drone, 3); // C-042 tombe à 0.42 de confiance radar
    const obs = radarMcp.getObservation(state, "C-042");
    expect(obs.radarStatus).toBe("unstable");
  });

  it("signale lost quand la piste est perdue", () => {
    const state = runUntil(getScenario("radar-loss"), 4);
    const obs = radarMcp.getObservation(state, "C-030");
    expect(obs.radarStatus).toBe("lost");
  });

  it("throw sur un contact inconnu", () => {
    const state = createInitialState(drone, "sim");
    expect(() => radarMcp.getObservation(state, "C-999")).toThrow();
  });
});

describe("AISMCP", () => {
  it("renvoie missing quand l'AIS est absent", () => {
    const state = createInitialState(drone, "sim");
    const ais = aisMcp.getAISData(state, "C-042");
    expect(ais.declaredRouteStatus).toBe("missing");
    expect(ais.shipName).toBeUndefined();
  });

  it("renvoie normal pour un contact avec AIS cohérent", () => {
    const state = createInitialState(drone, "sim");
    const ais = aisMcp.getAISData(state, "C-001");
    expect(ais.declaredRouteStatus).toBe("normal");
    expect(ais.shipName).toBe("Blue Marlin");
  });

  it("renvoie mismatch quand la route diverge", () => {
    const state = runUntil(getScenario("ais-route-mismatch"), 5);
    const ais = aisMcp.getAISData(state, "C-014");
    expect(ais.declaredRouteStatus).toBe("mismatch");
  });
});

describe("OptronicMCP", () => {
  it("classe un contact inconnu/USV comme petit objet de surface", () => {
    const state = createInitialState(drone, "sim");
    const obs = optronicMcp.getObservation(state, "C-042");
    expect(obs.classificationHint).toBe("small_surface_object");
    expect(obs.shape).toBe("low_profile_object");
  });

  it("classe un cargo comme cargo avec une grande coque", () => {
    const state = createInitialState(drone, "sim");
    const obs = optronicMcp.getObservation(state, "C-001");
    expect(obs.classificationHint).toBe("cargo");
    expect(obs.shape).toBe("large_hull");
    expect(obs.imageQuality).toBe(0.7);
  });

  it("mappe un patrouilleur vers une classification valide", () => {
    const state = createInitialState(getScenario("ais-route-mismatch"), "sim");
    const obs = optronicMcp.getObservation(state, "C-100");
    expect(obs.classificationHint).toBe("surface_vessel");
  });
});

describe("ScenarioMCP", () => {
  it("renvoie les événements d'un tour sans champ effects", () => {
    const events = scenarioMcp.getEventsForTurn(drone, 4);
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.turn).toBe(4);
      expect(event).not.toHaveProperty("effects");
    }
  });

  it("renvoie un tableau vide pour un tour sans événement", () => {
    expect(scenarioMcp.getEventsForTurn(drone, 99)).toEqual([]);
  });
});
