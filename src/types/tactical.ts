/**
 * Types tactiques de base d'Agent Us.
 *
 * `TacticalState` est l'unique source de vérité de la simulation : les agents
 * IA ne font qu'interpréter cet état, ils n'inventent jamais de faits tactiques.
 */

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
  | "possible_false_positive";

export type ContactHistoryPoint = {
  turn: number;
  position: Vec2;
  speedKnots: number;
  headingDeg: number;
};

export type ContactTrack = {
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
  | "system";

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
};
