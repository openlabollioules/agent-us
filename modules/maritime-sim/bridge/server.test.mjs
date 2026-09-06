import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createBridge } from "./server.mjs";
import { buildModel } from "../scripts/generate-models.mjs";
import { readFile } from "node:fs/promises";

let now = 1000, base, server;
const snapshot = {
  protocol: "maritime-scene/1", simulationId: "test", scenarioId: "example", turn: 0,
  presentation: "exercise", timeSeconds: 0,
  environment: { condition: "clear", sunElevationDeg: 35, waveHeightM: 0.5, visibilityM: 20000 },
  contacts: [], areas: [], focus: { center: { x: 0, y: 0, z: 0 }, radiusM: 100, contactIds: [] },
};
const frame = { owner: "owner-000000000001", revision: 1, snapshot,
  camera: { auto: true, yawDeg: 135, pitchDeg: -35, distanceM: 1600, altitudeOffsetM: 0 } };
const post = (body, headers = {}) => fetch(base + "/frame", { method: "POST",
  headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const render = () => fetch(base + "/frame", { headers: { "X-Maritime-Renderer": "1" } });
before(async () => {
  server = createBridge({ clock: () => now });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });

test("renderer health requires native heartbeat and expires", async () => {
  assert.equal((await (await fetch(base+"/health")).json()).rendererReady, false);
  assert.equal((await fetch(base+"/frame")).status, 403);
  await render();
  assert.equal((await (await fetch(base+"/health")).json()).rendererReady, true);
  now += 4001;
  assert.equal((await (await fetch(base+"/health")).json()).rendererReady, false);
});
test("accepts current frame, refuses competing owners and stale updates", async () => {
  assert.equal((await post(frame)).status, 200);
  assert.equal((await post({ ...frame, revision: 0 })).status, 409);
  assert.equal((await post({ ...frame, owner: "owner-000000000002" })).status, 409);
  assert.deepEqual((await (await render()).json()).frame, frame);
  assert.equal((await post({ ...frame, camera: { ...frame.camera, auto: false } })).status, 200);
  assert.equal((await (await render()).json()).frame.camera.auto, true);
});
test("lease expiry clears stale scene and permits a new owner at revision zero", async () => {
  now += 8001;
  assert.equal((await (await render()).json()).frame, null);
  assert.equal((await post({ ...frame, owner: "owner-000000000002", revision: 0 })).status, 200);
  assert.equal((await fetch(base+"/frame", { method: "DELETE", headers: { "X-Scene-Owner": frame.owner } })).status, 409);
  assert.equal((await fetch(base+"/frame", { method: "DELETE", headers: { "X-Scene-Owner": "owner-000000000002" } })).status, 200);
  assert.equal((await post({ ...frame, owner: "owner-000000000002", revision: 1 })).status, 409);
});
test("rejects foreign origins, malformed input, extra tactical secrets and oversize bodies", async () => {
  assert.equal((await post(frame, { Origin: "https://foreign.example" })).status, 403);
  assert.equal((await post({ ...frame, snapshot: { ...snapshot, expectedDiagnosis: "secret" } })).status, 400);
  assert.equal((await post({ ...frame, camera: { ...frame.camera, distanceM: -1 } })).status, 400);
  assert.equal((await fetch(base+"/frame", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })).status, 400);
  assert.equal((await post({ padding: "x".repeat(2*1024*1024) })).status, 413);
  const preflight = await fetch(base+"/frame", { method: "OPTIONS", headers: { Origin: "http://localhost:3000" } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:3000");
});
test("all model assets have finite, indexed, non-degenerate triangles", async () => {
  const catalog = JSON.parse(await readFile(new URL("../catalog/models.json", import.meta.url), "utf8"));
  for (const entry of catalog) {
    const mesh = buildModel(entry);
    assert.ok(mesh.faces.length > 0, entry.id);
    assert.ok(mesh.vertices.every((v) => v.every(Number.isFinite)), entry.id);
    for (const face of mesh.faces) {
      assert.ok(face.indices.every((i) => i >= 0 && i < mesh.vertices.length));
      const [a,b,c] = face.indices.map((i) => mesh.vertices[i]);
      const u = b.map((n,i) => n-a[i]), v = c.map((n,i) => n-a[i]);
      const area = Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);
      assert.ok(area > 1e-12, `${entry.id}: degenerate triangle`);
    }
  }
});
