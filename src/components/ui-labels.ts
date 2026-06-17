import type {
  ActionPriority,
  AnomalyType,
  EventSeverity,
  ScenarioDifficulty,
  SimulationStatus,
} from "@/types";

/** Libellé FR du statut de simulation. */
export const STATUS_LABEL: Record<SimulationStatus, string> = {
  not_started: "Non démarré",
  running: "En cours",
  awaiting_player: "Décision attendue",
  completed: "Terminé",
};

/** Emoji représentant chaque agent dans la console. */
export const AGENT_EMOJI: Record<string, string> = {
  "game-master-agent": "🎙️",
  "radar-agent": "📡",
  "navigation-agent": "🧭",
  "optronic-agent": "🎥",
  "threat-assessment-agent": "⚠️",
};

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  discreet_following: "Suivi discret",
  ais_route_mismatch: "Incohérence route AIS",
  sensor_uncertainty: "Incertitude capteur",
  false_positive: "Fausse alerte",
  unknown: "Indéterminé",
};

export const SEVERITY_COLOR: Record<EventSeverity, string> = {
  info: "bg-slate-600",
  low: "bg-sky-700",
  medium: "bg-amber-600",
  high: "bg-red-600",
};

export const PRIORITY_LABEL: Record<ActionPriority, string> = {
  high: "Prioritaire",
  medium: "Utile",
  low: "Optionnel",
};

export const PRIORITY_COLOR: Record<ActionPriority, string> = {
  high: "bg-red-500/20 text-red-300 border-red-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

export const DIFFICULTY_LABEL: Record<ScenarioDifficulty, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  expert: "Expert",
};
