import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "./game-store";

const store = () => useGameStore.getState();

describe("game-store", () => {
  beforeEach(() => store().reset());

  it("démarre un scénario et passe en écran de jeu", () => {
    store().start("drone-following-cargo");
    const s = store();
    expect(s.screen).toBe("playing");
    expect(s.state?.turn).toBe(0);
    expect(s.state?.agentMessages.length).toBeGreaterThan(0);
  });

  it("avance les tours jusqu'à awaiting_player", () => {
    store().start("drone-following-cargo");
    while (store().state?.status === "running") store().step();
    expect(store().state?.status).toBe("awaiting_player");
  });

  it("traite une instruction libre et enregistre l'action", () => {
    store().start("drone-following-cargo");
    store().step();
    store().sendInstruction("NavigationAgent, et C-042 ?");
    expect(store().state?.playerActions.length).toBe(1);
  });

  it("produit un débrief gagnant pour un bon diagnostic", () => {
    store().start("drone-following-cargo");
    while (store().state?.status === "running") store().step();
    store().submitDiagnosis({
      contactId: "C-042",
      anomalyType: "discreet_following",
      justification: "Trajectoire parallèle, distance constante, signature faible.",
      playerConfidence: 0.8,
    });
    const s = store();
    expect(s.screen).toBe("debrief");
    expect(s.debrief?.passed).toBe(true);
    expect(s.state?.status).toBe("completed");
  });

  it("reset ramène à l'écran de sélection", () => {
    store().start("drone-following-cargo");
    store().reset();
    expect(store().screen).toBe("select");
    expect(store().state).toBeNull();
  });
});
