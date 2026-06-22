import type {
  AcousticContact,
  Affiliation,
  AnomalyType,
  BehaviorProfile,
  ContactCategory,
  ContactFlag,
  PlayerDiagnosis,
  SensitiveArea,
  TacticalEvent,
  Vec2,
  WeatherState,
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
 * Effet scénarisé sur le contexte d'environnement V2 (météo, acoustique,
 * comportement). Comme `ContactEffect`, 100% déterministe et data-driven.
 * `set_behavior` fait un upsert par `contactId`.
 */
export type WorldEffect =
  | { kind: "set_weather"; weather: WeatherState }
  | { kind: "add_acoustic"; contact: AcousticContact }
  | {
      kind: "update_acoustic";
      id: string;
      patch: Partial<Omit<AcousticContact, "id">>;
    }
  | { kind: "remove_acoustic"; id: string }
  | { kind: "set_behavior"; profile: BehaviorProfile };

/**
 * Événement de la timeline d'un scénario : la partie publique (`TacticalEvent`)
 * est exposée à l'UI/au ScenarioMCP, les `effects` mutent les contacts et les
 * `worldEffects` font évoluer le contexte d'environnement V2.
 */
export type ScriptedEvent = TacticalEvent & {
  effects?: ContactEffect[];
  worldEffects?: WorldEffect[];
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

  /* V2 — contexte d'environnement initial (facultatif : absent en V1). */
  initialWeather?: WeatherState;
  sensitiveAreas?: SensitiveArea[];
  initialAcousticContacts?: AcousticContact[];
  initialBehaviorProfiles?: BehaviorProfile[];
};

export type ScoreResult = {
  /** Score 0..100. */
  score: number;
  passed: boolean;
  feedback: string[];
  /** Indices que le joueur aurait dû exploiter. */
  missedEvidence: string[];
};

/** Données complètes du débrief pédagogique (panneau de fin de partie). */
export type DebriefData = {
  scenarioTitle: string;
  score: number;
  passed: boolean;
  playerDiagnosis: PlayerDiagnosis;
  expected: ExpectedDiagnosis;
  contactCorrect: boolean;
  anomalyCorrect: boolean;
  feedback: string[];
  /** Indices clés non exploités dans la justification. */
  missedEvidence: string[];
  /** Skills utiles déclenchées par le joueur. */
  usefulSkills: string[];
  /** Agents les plus sollicités. */
  mostUsefulAgents: string[];
  /** Explication métier/IA du scénario. */
  explanation: string;
  pedagogicalGoals: string[];
};
