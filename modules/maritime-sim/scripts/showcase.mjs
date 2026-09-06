import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { snapshotSchema } from "../protocol/schema.ts";

const catalog = JSON.parse(await readFile(new URL("../catalog/models.json", import.meta.url), "utf8"));
const input = process.argv[2];
const snapshot = snapshotSchema.parse(input
  ? JSON.parse(await readFile(input, "utf8"))
  : {
    protocol: "maritime-scene/1", simulationId: "showcase", scenarioId: "fleet-gallery",
    turn: 0, presentation: "showcase", timeSeconds: 0,
    environment: { condition: "clear", sunElevationDeg: 35, waveHeightM: 0.5, visibilityM: 20000 },
    contacts: catalog.filter((m) => m.id !== "uncertain").map((m, i) => ({
      id: m.id, label: m.label, model: m.id,
      position: { x: (i % 4) * 400 - 600, y: Math.floor(i / 4) * 500 - 500,
        z: m.shape === "submarine" ? -40 : m.shape === "helicopter" ? 70 : 0 },
      headingDeg: 90, uncertain: false, highlighted: false, affiliation: "friendly", trail: [],
    })), areas: [], focus: { center: { x: 0, y: 0, z: 0 }, radiusM: 1200, contactIds: [] },
  });
const owner = randomUUID();
const bridge = process.env.SCENE_BRIDGE_URL ?? "http://127.0.0.1:8787";
const frame = { owner, revision: 0, snapshot, camera: {
  auto: true, yawDeg: 135, pitchDeg: -35, distanceM: 1800, altitudeOffsetM: 0,
} };
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
console.log("Standalone scene. Ctrl+C to release. Positions and dimensions are fictional.");
while (!stopping) {
  try {
    const response = await fetch(`${bridge}/frame`, { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(frame),
      signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
  } catch (error) { console.error(error.message); }
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
await fetch(`${bridge}/frame`, { method: "DELETE", headers: { "X-Scene-Owner": owner },
  signal: AbortSignal.timeout(2500) }).catch(() => {});
