import { describe, expect, it } from "vitest";
import type { TacticalState } from "@/types";
import { POST as startPOST } from "./start/route";
import { POST as stepPOST } from "./step/route";
import { POST as actionPOST } from "./action/route";
import { POST as diagnosePOST } from "./diagnose/route";

function post(body: unknown): Request {
  return new Request("http://test/api/simulation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function startGame(): Promise<TacticalState> {
  const res = await startPOST(post({ scenarioId: "drone-following-cargo" }));
  return res.json();
}

describe("POST /start", () => {
  it("démarre un scénario", async () => {
    const res = await startPOST(post({ scenarioId: "drone-following-cargo" }));
    expect(res.status).toBe(200);
    const state = await res.json();
    expect(state.turn).toBe(0);
    expect(state.status).toBe("running");
  });

  it("400 si le corps est invalide", async () => {
    const res = await startPOST(post({}));
    expect(res.status).toBe(400);
  });

  it("400 si le scénario est inconnu", async () => {
    const res = await startPOST(post({ scenarioId: "nope" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /step", () => {
  it("avance d'un tour", async () => {
    const state = await startGame();
    const res = await stepPOST(post({ state }));
    expect(res.status).toBe(200);
    const next = await res.json();
    expect(next.turn).toBe(1);
  });

  it("400 si l'état est mal formé", async () => {
    const res = await stepPOST(post({ state: { turn: 0 } }));
    expect(res.status).toBe(400);
  });
});

describe("POST /action", () => {
  it("traite une instruction libre", async () => {
    const state = await startGame();
    const res = await actionPOST(
      post({ state, instruction: "RadarAgent, analyse C-042" }),
    );
    expect(res.status).toBe(200);
    const next = await res.json();
    expect(next.playerActions).toHaveLength(1);
  });

  it("400 si ni instruction ni action ne sont fournies", async () => {
    const state = await startGame();
    const res = await actionPOST(post({ state }));
    expect(res.status).toBe(400);
  });
});

describe("POST /diagnose", () => {
  it("renvoie score + débrief", async () => {
    let state = await startGame();
    // avance jusqu'au bout
    for (let i = 0; i < 8; i++) {
      const res = await stepPOST(post({ state }));
      state = await res.json();
    }
    const res = await diagnosePOST(
      post({
        state,
        diagnosis: {
          contactId: "C-042",
          anomalyType: "discreet_following",
          justification: "Trajectoire parallèle, distance constante, signature faible.",
          playerConfidence: 0.8,
        },
      }),
    );
    expect(res.status).toBe(200);
    const result = await res.json();
    expect(result.score.passed).toBe(true);
    expect(result.state.status).toBe("completed");
    expect(result.debrief.scenarioTitle.length).toBeGreaterThan(0);
  });
});
