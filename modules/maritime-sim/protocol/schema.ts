import { z } from "zod";

// Portable presentation contract. No diagnosis, hidden events, agents or credentials.
export const modelIdSchema = z.enum([
  "fdi", "suffren", "seaquest-s", "seaquest-m", "seaquest-l",
  "seagent-m", "seagent-xl", "france-libre", "vsr700",
  "cargo", "fishing", "patrol", "uncertain",
]);
export type ModelId = z.infer<typeof modelIdSchema>;
const scalar = z.number().finite();
const id = z.string().min(1).max(100);
const position = z.object({
  x: scalar.min(-100000).max(100000),
  y: scalar.min(-100000).max(100000),
  z: scalar.min(-2000).max(20000),
}).strict();
export const snapshotSchema = z.object({
  protocol: z.literal("maritime-scene/1"),
  simulationId: id,
  scenarioId: id,
  turn: z.number().int().min(0).max(100000),
  presentation: z.enum(["exercise", "showcase"]),
  timeSeconds: scalar.min(0).max(100000000),
  environment: z.object({
    condition: z.enum(["clear", "rain", "fog", "storm", "high_sea"]),
    sunElevationDeg: scalar.min(-90).max(90),
    waveHeightM: scalar.min(0).max(20),
    visibilityM: scalar.min(20).max(100000),
  }).strict(),
  contacts: z.array(z.object({
    id,
    label: z.string().max(160),
    model: modelIdSchema,
    position,
    headingDeg: scalar.min(0).max(360),
    uncertain: z.boolean(),
    highlighted: z.boolean(),
    affiliation: z.enum(["friendly", "neutral", "unknown"]),
    trail: z.array(position).max(256),
    relationTargetId: id.optional(),
  }).strict()).max(256),
  areas: z.array(z.object({ id, label: z.string().max(160), center: position,
    radiusM: scalar.min(0).max(100000) }).strict()).max(64),
  focus: z.object({ center: position, radiusM: scalar.min(25).max(100000),
    contactIds: z.array(id).max(256) }).strict(),
}).strict().superRefine((scene, ctx) => {
  const ids = scene.contacts.map((contact) => contact.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Duplicate contact IDs" });
  for (const contact of scene.contacts) {
    if (contact.uncertain && contact.model !== "uncertain")
      ctx.addIssue({ code: "custom", message: "Uncertain contacts must use an anonymous marker" });
    if (contact.relationTargetId && !ids.includes(contact.relationTargetId))
      ctx.addIssue({ code: "custom", message: "Unknown relation target" });
  }
  if (scene.focus.contactIds.some((value) => !ids.includes(value)))
    ctx.addIssue({ code: "custom", message: "Unknown focus target" });
});
export type SceneSnapshot = z.infer<typeof snapshotSchema>;
export const cameraSchema = z.object({
  auto: z.boolean(),
  targetId: id.optional(),
  // Absolute offsets: safe to resend and independent of network ordering.
  yawDeg: scalar.min(-36000).max(36000),
  pitchDeg: scalar.min(-85).max(85),
  distanceM: scalar.min(20).max(30000),
  altitudeOffsetM: scalar.min(-1500).max(15000),
}).strict();
export type SceneCamera = z.infer<typeof cameraSchema>;
export const publishSchema = z.object({
  owner: z.string().min(16).max(100),
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  snapshot: snapshotSchema,
  camera: cameraSchema,
}).strict();
export const healthSchema = z.object({
  protocol: z.literal("maritime-scene/1"),
  rendererReady: z.boolean(),
});
