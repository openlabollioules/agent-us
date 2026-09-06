/**
 * Types tactiques de base d'Agent Us.
 *
 * `TacticalState` est l'unique source de vérité de la simulation : les agents
 * IA ne font qu'interpréter cet état, ils n'inventent jamais de faits tactiques.
 */

import type { ContactVisual } from "./visual";

export type Vec2 = { x: number; y: number };

export type ContactCategory =
  | "surface_vessel"
  | "submarine"
  | "usv_drone"
  | "uav_drone"
  | "cargo"
  | "fishing_vessel"
  | "patrol_boat"
  | "unknown";

export type Affiliation = "friendly" | "neutral" | "unknown";

/**
 * Drapeaux attachés à un contact (visibles sur la carte / utilisés par les
 * suggestions). Ne contient que des indices liés à un contact précis.
 */
export type ContactFlag =
  | "ais_missing"
  | "ais_route_mismatch"
  | "trajectory_anomaly"
  | "low_radar_confidence"
  | "radar_contact_lost"
  | "small_object_near_civilian"
  | "constant_distance_following"
  | "optronic_confirmation_needed"
  | "possible_false_positive"
  // V2 — drapeaux liés aux nouveaux domaines (météo, zones sensibles, acoustique).
  | "weather_degraded"
  | "near_sensitive_area"
  | "acoustic_only";

export type ContactHistoryPoint = {
  turn: number;
  position: Vec2;
  speedKnots: number;
  headingDeg: number;
};

export type ContactTrack = {
  visual?: ContactVisual;
  id: string;
  label: string;
  category: ContactCategory;
  affiliation: Affiliation;

  position: Vec2;
  speedKnots: number;
  headingDeg: number;

  history: ContactHistoryPoint[];

  radarConfidence: number;
  aisConfidence: number;
  optronicConfidence: number;

  /** Niveau de suspicion calculé par le moteur (0..1). */
  suspicionScore: number;
  flags: ContactFlag[];

  isHighlighted?: boolean;
  isUnderWatch?: boolean;
  /** Contact lié (ex : le cargo suivi par un USV). */
  relationTargetId?: string;
};

export type EventSeverity = "info" | "low" | "medium" | "high";

export type TacticalEventType =
  | "mission_started"
  | "contact_detected"
  | "radar_confidence_drop"
  | "ais_mismatch"
  | "trajectory_anomaly"
  | "optronic_hint"
  | "threat_level_changed"
  | "player_action"
  | "system"
  // V2 — événements des nouveaux domaines.
  | "weather_changed"
  | "acoustic_contact"
  | "sensitive_area_alert"
  | "behavior_assessed";

export type VisualCue = {
  focusContactId?: string;
  showTrajectory?: boolean;
  showRelationLines?: boolean;
  highlightArea?: boolean;
  zoomLevel?: "normal" | "close";
};

export type TacticalEvent = {
  id: string;
  turn: number;
  type: TacticalEventType;
  severity: EventSeverity;
  contactId?: string;
  title: string;
  description: string;
  visualCue?: VisualCue;
};

export type ActionPriority = "low" | "medium" | "high";
export type ActionDifficulty = "beginner" | "intermediate" | "expert";

export type SuggestedAction = {
  id: string;
  label: string;
  description: string;
  targetAgentId: string;
  skillName?: string;
  priority: ActionPriority;
  difficulty: ActionDifficulty;
  promptTemplate: string;
};

export type AgentMessage = {
  id: string;
  turn: number;
  agentId: string;
  agentName: string;
  message: string;
  confidence?: number;
  referencedContacts: string[];
  usedSkills: string[];
  /** Horodatage déterministe (dérivé du tour), jamais Date.now(). */
  timestamp: string;
};

export type PlayerAction = {
  id: string;
  turn: number;
  type: "suggested_action" | "free_instruction";
  instruction: string;
  targetAgentId?: string;
  skillName?: string;
};

export type AnomalyType =
  | "discreet_following"
  | "ais_route_mismatch"
  | "sensor_uncertainty"
  | "false_positive"
  // V2 — comportements ambigus et nouveaux domaines de capteurs.
  | "ambiguous_behavior"
  | "loitering_near_sensitive_area"
  | "subsurface_contact"
  | "unknown";

export type PlayerDiagnosis = {
  contactId: string;
  anomalyType: AnomalyType;
  justification: string;
  playerConfidence: number;
};

export type VisualFocus = {
  contactIds: string[];
  center: Vec2;
  zoom: number;
  reason: string;
  showTrajectories: boolean;
  showRelationLines: boolean;
};

export type SimulationStatus =
  | "not_started"
  | "running"
  | "awaiting_player"
  | "completed";

/* ------------------------------------------------------------------ */
/* V2 — contexte d'environnement (tous facultatifs, ajoutés sans       */
/* casser la V1). Comme TacticalState, ce sont des faits déterministes  */
/* que les agents interprètent ; ils n'en inventent jamais.            */
/* ------------------------------------------------------------------ */

export type WeatherCondition = "clear" | "rain" | "fog" | "storm" | "high_sea";

/** Conditions météo de la zone et leur impact sur les capteurs. */
export type WeatherState = {
  condition: WeatherCondition;
  /** Dégradation capteur induite (0..1) : 0 = nominal, 1 = très dégradé. */
  sensorDegradation: number;
  description: string;
};

/** Zone circulaire dans l'espace logique de la carte [0, MAP_SIZE]. */
export type AreaShape = { center: Vec2; radiusUnits: number };

/** Zone sensible (fictive, pédagogique) à surveiller. */
export type SensitiveArea = {
  id: string;
  label: string;
  area: AreaShape;
  description: string;
};

export type AcousticClassification =
  | "biologic"
  | "surface_traffic"
  | "submerged"
  | "unknown";

/**
 * Piste acoustique simulée : un relèvement et une classification incertaine.
 * Volontairement pauvre en position (l'acoustique donne surtout une direction).
 */
export type AcousticContact = {
  id: string;
  label: string;
  bearingDeg: number;
  /** Portée estimée (NM) — incertaine par nature, donc facultative. */
  estimatedRangeNm?: number;
  /** Confiance de la détection acoustique (0..1). */
  confidence: number;
  classification: AcousticClassification;
  /** Contact tactique corrélé, si une association a été faite. */
  linkedContactId?: string;
};

export type BehaviorPattern =
  | "transit"
  | "loitering"
  | "erratic"
  | "shadowing"
  | "fishing"
  | "diving";

/** Profil de comportement déduit pour un contact (interprétation, pas preuve). */
export type BehaviorProfile = {
  contactId: string;
  pattern: BehaviorPattern;
  /** Cohérence du classement (0..1) : faible = comportement ambigu. */
  consistency: number;
  note: string;
};

export type TacticalState = {
  simulationId: string;
  turn: number;
  scenarioId: string;
  status: SimulationStatus;

  contacts: ContactTrack[];
  events: TacticalEvent[];
  agentMessages: AgentMessage[];
  suggestedActions: SuggestedAction[];
  playerActions: PlayerAction[];

  visualFocus?: VisualFocus;
  diagnosis?: PlayerDiagnosis;

  /* V2 — contexte d'environnement (facultatif : absent en V1). */
  weather?: WeatherState;
  sensitiveAreas?: SensitiveArea[];
  acousticContacts?: AcousticContact[];
  behaviorProfiles?: BehaviorProfile[];
};
