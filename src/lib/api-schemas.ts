import { z } from "zod";

/**
 * Schémas Zod de validation des entrées API. L'architecture étant
 * client-driven, ces routes existent pour la parité et l'intégration LLM
 * server-side : on valide donc le TacticalState reçu avant de le traiter.
 */

const vec2 = z.object({ x: z.number(), y: z.number() });

const contactFlag = z.enum([
  "ais_missing",
  "ais_route_mismatch",
  "trajectory_anomaly",
  "low_radar_confidence",
  "radar_contact_lost",
  "small_object_near_civilian",
  "constant_distance_following",
  "optronic_confirmation_needed",
  "possible_false_positive",
]);

const contactCategory = z.enum([
  "surface_vessel",
  "submarine",
  "usv_drone",
  "uav_drone",
  "cargo",
  "fishing_vessel",
  "patrol_boat",
  "unknown",
]);

const affiliation = z.enum(["friendly", "neutral", "unknown"]);
const severity = z.enum(["info", "low", "medium", "high"]);
const anomalyType = z.enum([
  "discreet_following",
  "ais_route_mismatch",
  "sensor_uncertainty",
  "false_positive",
  "unknown",
]);
const priority = z.enum(["low", "medium", "high"]);
const difficulty = z.enum(["beginner", "intermediate", "expert"]);

const historyPoint = z.object({
  turn: z.number(),
  position: vec2,
  speedKnots: z.number(),
  headingDeg: z.number(),
});

const contactTrack = z.object({
  id: z.string(),
  label: z.string(),
  category: contactCategory,
  affiliation,
  position: vec2,
  speedKnots: z.number(),
  headingDeg: z.number(),
  history: z.array(historyPoint),
  radarConfidence: z.number(),
  aisConfidence: z.number(),
  optronicConfidence: z.number(),
  suspicionScore: z.number(),
  flags: z.array(contactFlag),
  isHighlighted: z.boolean().optional(),
  isUnderWatch: z.boolean().optional(),
  relationTargetId: z.string().optional(),
});

const tacticalEvent = z.object({
  id: z.string(),
  turn: z.number(),
  type: z.enum([
    "mission_started",
    "contact_detected",
    "radar_confidence_drop",
    "ais_mismatch",
    "trajectory_anomaly",
    "optronic_hint",
    "threat_level_changed",
    "player_action",
    "system",
  ]),
  severity,
  contactId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  visualCue: z
    .object({
      focusContactId: z.string().optional(),
      showTrajectory: z.boolean().optional(),
      showRelationLines: z.boolean().optional(),
      highlightArea: z.boolean().optional(),
      zoomLevel: z.enum(["normal", "close"]).optional(),
    })
    .optional(),
});

const suggestedAction = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  targetAgentId: z.string(),
  skillName: z.string().optional(),
  priority,
  difficulty,
  promptTemplate: z.string(),
});

const agentMessage = z.object({
  id: z.string(),
  turn: z.number(),
  agentId: z.string(),
  agentName: z.string(),
  message: z.string(),
  confidence: z.number().optional(),
  referencedContacts: z.array(z.string()),
  usedSkills: z.array(z.string()),
  timestamp: z.string(),
});

const playerAction = z.object({
  id: z.string(),
  turn: z.number(),
  type: z.enum(["suggested_action", "free_instruction"]),
  instruction: z.string(),
  targetAgentId: z.string().optional(),
  skillName: z.string().optional(),
});

export const playerDiagnosisSchema = z.object({
  contactId: z.string(),
  anomalyType,
  justification: z.string(),
  playerConfidence: z.number(),
});

const visualFocus = z.object({
  contactIds: z.array(z.string()),
  center: vec2,
  zoom: z.number(),
  reason: z.string(),
  showTrajectories: z.boolean(),
  showRelationLines: z.boolean(),
});

export const tacticalStateSchema = z.object({
  simulationId: z.string(),
  turn: z.number(),
  scenarioId: z.string(),
  status: z.enum(["not_started", "running", "awaiting_player", "completed"]),
  contacts: z.array(contactTrack),
  events: z.array(tacticalEvent),
  agentMessages: z.array(agentMessage),
  suggestedActions: z.array(suggestedAction),
  playerActions: z.array(playerAction),
  visualFocus: visualFocus.optional(),
  diagnosis: playerDiagnosisSchema.optional(),
});

// ── Entrées par route ──────────────────────────────────────────────

export const startSchema = z.object({ scenarioId: z.string().min(1) });

export const stepSchema = z.object({ state: tacticalStateSchema });

export const actionSchema = z
  .object({
    state: tacticalStateSchema,
    instruction: z.string().min(1).optional(),
    action: suggestedAction.optional(),
  })
  .refine((d) => !!d.instruction !== !!d.action, {
    message: "Fournir soit `instruction`, soit `action` (exclusivement).",
  });

export const diagnoseSchema = z.object({
  state: tacticalStateSchema,
  diagnosis: playerDiagnosisSchema,
});
