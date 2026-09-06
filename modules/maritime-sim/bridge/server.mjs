import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { publishSchema } from "../protocol/schema.ts";

const LIMIT = 2 * 1024 * 1024;
const LEASE_MS = 8000;

/** One bridge + renderer per player. Monotonic revisions prevent stale HTTP writes. */
export function createBridge({ origins = ["http://localhost:3000", "http://127.0.0.1:3000"],
  clock = Date.now } = {}) {
  let frame = null;
  let lastWriter = 0;
  let lastRenderer = -Infinity;
  let generation = 0;
  const revoked = new Map();
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, body) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    // Prevent browser DNS rebinding to this loopback-only service.
    const host = req.headers.host?.split(":")[0];
    if (!["127.0.0.1", "localhost"].includes(host)) return send(403, { error: "Host rejected" });
    if (origin && !origins.includes(origin)) return send(403, { error: "Origin rejected" });
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Scene-Owner");
      return send(204, null);
    }
    if (frame && clock() - lastWriter > LEASE_MS) { frame = null; generation++; }
    for (const [owner, expiry] of revoked) if (expiry < clock()) revoked.delete(owner);
    const path = new URL(req.url, "http://localhost").pathname;
    if (req.method === "GET" && path === "/health")
      return send(200, { protocol: "maritime-scene/1", rendererReady: clock() - lastRenderer < 4000 });
    if (req.method === "GET" && path === "/frame") {
      // The renderer polls natively; browser reads cannot impersonate its heartbeat.
      if (origin || req.headers["x-maritime-renderer"] !== "1") return send(403, { error: "Native renderer only" });
      lastRenderer = clock();
      return send(200, { generation, frame });
    }
    if (req.method === "DELETE" && path === "/frame") {
      const owner = req.headers["x-scene-owner"];
      if (typeof owner !== "string" || owner.length < 16 || owner.length > 100)
        return send(400, { error: "Owner required" });
      if (frame && req.headers["x-scene-owner"] !== frame.owner)
        return send(409, { error: "Renderer already in use" });
      // A delayed in-flight POST must not resurrect a released session.
      revoked.set(owner, clock() + LEASE_MS);
      if (revoked.size > 256) revoked.delete(revoked.keys().next().value);
      frame = null; generation++;
      return send(200, { released: true });
    }
    if (req.method !== "POST" || path !== "/frame") return send(404, { error: "Not found" });
    if (!req.headers["content-type"]?.startsWith("application/json"))
      return send(415, { error: "JSON required" });
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > LIMIT) { send(413, { error: "Frame too large" }); return; }
        chunks.push(chunk);
      }
      const parsed = publishSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      if (!parsed.success) return send(400, { error: "Invalid scene frame" });
      const next = parsed.data;
      if (revoked.has(next.owner)) return send(409, { error: "Session released" });
      if (frame && frame.owner !== next.owner) return send(409, { error: "Renderer already in use" });
      if (frame && next.revision < frame.revision) return send(409, { error: "Stale revision" });
      // Equal revisions are heartbeat retries, not mutations.
      if (!frame || next.revision > frame.revision) frame = next;
      lastWriter = clock();
      return send(200, { revision: frame.revision });
    } catch {
      if (!res.headersSent) send(400, { error: "Invalid JSON" });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const origins = (process.env.SCENE_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",");
  const port = Number(process.env.SCENE_PORT ?? 8787);
  createBridge({ origins }).listen(port, "127.0.0.1", () => {
    console.log(`Maritime scene bridge: http://127.0.0.1:${port} (one player per instance)`);
  });
}
