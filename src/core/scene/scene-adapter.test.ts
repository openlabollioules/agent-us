import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "@/data/scenarios";
import { createInitialState, advanceTurn as stepSimulation } from "@/core/simulation";
import type { ScenarioDefinition } from "@/types";
import { toSceneSnapshot, SECONDS_PER_TURN } from "./scene-adapter";
import { snapshotSchema } from "../../../modules/maritime-sim/protocol/schema";

const startSimulation = (scenario: ScenarioDefinition) => createInitialState(scenario, "scene-test");

describe("portable Unreal scene", () => {
  it.each(SCENARIOS)("validates every turn of $id without changing tactical state", (scenario) => {
    let state = startSimulation(scenario);
    for (let turn = 0; turn <= scenario.maxTurns; turn++) {
      const original = JSON.stringify(state);
      const snapshot = toSceneSnapshot(state);
      expect(snapshotSchema.safeParse(snapshot).success).toBe(true);
      expect(toSceneSnapshot(state)).toEqual(snapshot);
      expect(JSON.stringify(state)).toBe(original);
      expect(snapshot.contacts.map((c) => c.id)).toEqual(state.contacts.map((c) => c.id));
      expect(snapshot.timeSeconds).toBe(state.turn * SECONDS_PER_TURN);
      expect(snapshot).not.toHaveProperty("diagnosis");
      expect(snapshot).not.toHaveProperty("events");
      expect(snapshot).not.toHaveProperty("agentMessages");
      state = stepSimulation(state, scenario);
    }
  });

  it("does not reveal submarine identity or invent a depth during diagnosis", () => {
    const state = startSimulation(getScenario("submarine-contact"));
    const contact = toSceneSnapshot(state).contacts.find((c) => c.id === "C-440")!;
    expect(contact.model).toBe("uncertain");
    expect(contact.position.z).toBe(0);
    expect(JSON.stringify(contact)).not.toContain("suffren");
  });

  it("carries authored friendly fleet models and depths through subsequent turns", () => {
    const scenario = getScenario("gan-exercise");
    const state = stepSimulation(startSimulation(scenario), scenario);
    const contacts = toSceneSnapshot(state).contacts;
    expect(contacts.find((c) => c.id === "EX-SUF")).toMatchObject({ model: "suffren", position: { z: -40 } });
    expect(contacts.find((c) => c.id === "EX-UAV")).toMatchObject({ model: "vsr700", position: { z: 80 } });
    expect(contacts.find((c) => c.id === "C-001")?.model).toBe("france-libre");
    expect(contacts.find((c) => c.id === "C-042")?.model).toBe("uncertain");
  });

  it("converts map axes and never substitutes presentation scale for tactical movement", () => {
    const state = startSimulation(SCENARIOS[0]);
    state.contacts[0] = { ...state.contacts[0], position: { x: 600, y: 300 }, headingDeg: 90 };
    const scene = toSceneSnapshot(state);
    expect(scene.contacts[0].position).toEqual({ x: 1000, y: -2000, z: 0 });
    expect(scene.contacts[0].headingDeg).toBe(90);
  });

  it("rejects hidden identity leaks, duplicate IDs and non-finite coordinates", () => {
    const scene = toSceneSnapshot(startSimulation(SCENARIOS[0]));
    expect(snapshotSchema.safeParse({ ...scene, contacts: [scene.contacts[0], scene.contacts[0]] }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...scene, contacts: [{ ...scene.contacts[0], uncertain: true }] }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...scene, focus: { ...scene.focus, radiusM: Infinity } }).success).toBe(false);
  });
});
