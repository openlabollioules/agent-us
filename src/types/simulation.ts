import type {
  Affiliation,
  AnomalyType,
  ContactCategory,
  ContactFlag,
  TacticalEvent,
  Vec2,
} from "./tactical";

export type ScenarioDifficulty = "beginner" | "intermediate" | "expert";

export type ScenarioMeta = {
  id: string;
  title: string;
  difficulty: ScenarioDifficulty;
  objective: string;
  estimatedMinutes: number;
};

/** Contact tel que défini au départ d'un scénario (avant déroulé du moteur). */
export type ContactSeed = {
  id: string;
  label: string;
  category: ContactCategory;
  affiliation: Affiliation;
  position: Vec2;
  speedKnots: number;
  headingDeg: number;
  radarConfidence: number;
  aisConfidence: number;
  optronicConfidence: number;
  flags?: ContactFlag[];
  suspicionScore?: number;
  relationTargetId?: string;
};

/**
 * Effet appliqué à un contact lors d'un événement scénarisé. Permet des
 * trajectoires et révélations 100% déterministes et data-driven, sans aléa.
 */
export type ContactEffect = {
  contactId: string;
  addFlags?: ContactFlag[];
  removeFlags?: ContactFlag[];
  /** Nouveau cap maintenu à partir de ce tour. */
  headingDeg?: number;
  speedKnots?: number;
  /** Modifie les confiances capteurs (valeur absolue 0..1). */
  radarConfidence?: number;
  aisConfidence?: number;
  optronicConfidence?: number;
  setRelationTargetId?: string;
};

/**
 * Événement de la timeline d'un scénario : la partie publique (`TacticalEvent`)
 * est exposée à l'UI/au ScenarioMCP, les `effects` mutent l'état tactique.
 */
export type ScriptedEvent = TacticalEvent & {
  effects?: ContactEffect[];
};

export type ExpectedDiagnosis = {
  contactId: string;
  anomalyType: AnomalyType;
  /** Indices clés attendus, affichés au débrief. */
  keyEvidence: string[];
};

export type ScenarioDefinition = ScenarioMeta & {
  /** Briefing initial présenté par le GameMasterAgent. */
  briefing: string;
  maxTurns: number;
  initialContacts: ContactSeed[];
  timeline: ScriptedEvent[];
  expectedDiagnosis: ExpectedDiagnosis;
  pedagogicalGoals: string[];
  /** Explication métier/IA affichée au débrief. */
  debriefExplanation: string;
};

export type ScoreResult = {
  /** Score 0..100. */
  score: number;
  passed: boolean;
  feedback: string[];
  /** Indices que le joueur aurait dû exploiter. */
  missedEvidence: string[];
};
