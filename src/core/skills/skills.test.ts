import { describe, expect, it } from "vitest";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import { aisMcp, optronicMcp, radarMcp } from "@/core/mcp";
import type { ScenarioDefinition, TacticalState } from "@/types";
import {
  classifySurfaceContact,
  compareAisRoute,
  detectAbnormalTrajectory,
  detectContact,
  estimateConfidence,
  estimateThreatLevel,
  generatePedagogicalExplanation,
  suggestNextActions,
  trackContact,
} from "./index";

function runUntil(scenario: ScenarioDefinition, turn: number): TacticalState {
  let state = createInitialState(scenario, "sim-skill");
  while (state.turn < turn) state = advanceTurn(state, scenario);
  return state;
}

const drone = getScenario("drone-following-cargo");

describe("detect_contact", () => {
  it("signale une confiance radar faible", () => {
    const state = runUntil(drone, 3);
    const obs = radarMcp.getObservation(state, "C-042");
    const r = detectContact(obs);
    expect(r.skill).toBe("detect_contact");
    expect(r.flags).toContain("low_radar_confidence");
  });
});

describe("track_contact", () => {
  it("signale un historique insuffisant au tour 0", () => {
    const state = createInitialState(drone, "sim");
    const r = trackContact(state.contacts[0]!);
    expect(r.flags).toContain("insufficient_history");
  });

  it("détecte un changement de cap notable (C-042 vire au tour 4)", () => {
    const state = runUntil(drone, 4);
    const c042 = state.contacts.find((c) => c.id === "C-042")!;
    const r = trackContact(c042);
    expect(r.flags).toContain("trajectory_anomaly");
  });
});

describe("compare_ais_route", () => {
  it("renvoie ais_missing quand l'AIS est absent", () => {
    const state = createInitialState(drone, "sim");
    const c042 = state.contacts.find((c) => c.id === "C-042")!;
    const r = compareAisRoute(c042, aisMcp.getAISData(state, "C-042"));
    expect(r.flags).toContain("ais_missing");
  });

  it("détecte une incohérence de route", () => {
    const state = runUntil(getScenario("ais-route-mismatch"), 5);
    const c014 = state.contacts.find((c) => c.id === "C-014")!;
    const r = compareAisRoute(c014, aisMcp.getAISData(state, "C-014"));
    expect(r.flags).toContain("ais_route_mismatch");
  });
});

describe("detect_abnormal_trajectory", () => {
  it("conserve les drapeaux précis détectés", () => {
    const state = runUntil(drone, 5);
    const c042 = state.contacts.find((c) => c.id === "C-042")!;
    const r = detectAbnormalTrajectory(c042);
    expect(r.flags).toContain("constant_distance_following");
  });
});

describe("classify_surface_contact", () => {
  it("classe l'USV comme petit objet de surface", () => {
    const state = createInitialState(drone, "sim");
    const obs = optronicMcp.getObservation(state, "C-042");
    const r = classifySurfaceContact(obs);
    expect(r.flags).toContain("small_object_near_civilian");
  });
});

describe("estimate_confidence", () => {
  it("émet le drapeau d'analyse low_confidence", () => {
    const r = estimateConfidence([0.4, 0.3]);
    expect(r.flags).toContain("low_confidence");
    expect(r.confidence).toBeCloseTo(0.35, 2);
  });

  it("gère une liste vide", () => {
    const r = estimateConfidence([]);
    expect(r.confidence).toBe(0);
    expect(r.flags).toEqual([]);
  });
});

describe("estimate_threat_level", () => {
  it("renvoie un niveau élevé pour un fort suspect", () => {
    const state = runUntil(drone, drone.maxTurns);
    const c042 = state.contacts.find((c) => c.id === "C-042")!;
    const r = estimateThreatLevel(c042);
    expect(r.summary).toContain("élevé");
  });
});

describe("suggest_next_actions", () => {
  it("propose au maximum 5 actions pertinentes", () => {
    const state = runUntil(drone, drone.maxTurns);
    const actions = suggestNextActions(state);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(5);
    expect(actions.some((a) => a.skillName === "classify_surface_contact")).toBe(true);
  });

  it("propose de réduire l'incertitude sur une fausse alerte", () => {
    const state = runUntil(getScenario("radar-loss"), 5);
    const actions = suggestNextActions(state);
    expect(actions.some((a) => a.id.startsWith("reduce-uncertainty"))).toBe(true);
  });
});

describe("generate_pedagogical_explanation", () => {
  it("explique le suivi discret", () => {
    const state = runUntil(drone, drone.maxTurns);
    const c042 = state.contacts.find((c) => c.id === "C-042")!;
    expect(generatePedagogicalExplanation(c042)).toMatch(/suivi discret/i);
  });
});
