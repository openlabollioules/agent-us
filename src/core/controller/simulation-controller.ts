import type {
  AgentId,
  AgentMessage,
  DebriefData,
  PlayerDiagnosis,
  ScoreResult,
  SuggestedAction,
  TacticalEventType,
  TacticalState,
} from "@/types";
import { getScenario } from "@/data/scenarios";
import { advanceTurn, createInitialState } from "@/core/simulation";
import { AGENTS_BY_ID, gameMasterAgent } from "@/core/agents";
import { agentRuntime, AgentRuntime } from "@/core/runtime";
import { applySuggestions } from "@/core/suggestions";
import { applyVisualFocus } from "@/core/attention";
import { buildDebrief, scoreDiagnosis } from "@/core/scoring";

/** Agent qui commente spontanément un type d'événement. */
const AGENT_FOR_EVENT: Partial<Record<TacticalEventType, AgentId>> = {
  contact_detected: "radar-agent",
  radar_confidence_drop: "radar-agent",
  ais_mismatch: "navigation-agent",
  trajectory_anomaly: "navigation-agent",
  optronic_hint: "optronic-agent",
  threat_level_changed: "threat-assessment-agent",
  system: "game-master-agent",
  // V2 — nouveaux domaines (réutilise les agents existants).
  weather_changed: "radar-agent",
  acoustic_contact: "radar-agent",
  sensitive_area_alert: "navigation-agent",
  behavior_assessed: "threat-assessment-agent",
};

export type DiagnoseResult = {
  state: TacticalState;
  score: ScoreResult;
  debrief: DebriefData;
};

/**
 * SimulationController — couche application. Compose le moteur tactique, les
 * commentaires d'agents, le moteur de suggestions et l'attention visuelle pour
 * exposer des opérations « jouer un tour / agir / diagnostiquer » prêtes pour
 * l'UI et l'API. Entièrement déterministe.
 */
export class SimulationController {
  constructor(private readonly runtime: AgentRuntime = agentRuntime) {}

  /** Démarre un scénario : état initial + briefing + enrichissement. */
  start(scenarioId: string, simulationId: string): TacticalState {
    const scenario = getScenario(scenarioId);
    const base = createInitialState(scenario, simulationId);
    const intro = gameMasterAgent.present(base, scenario);
    return this.enrich({ ...base, agentMessages: [intro] });
  }

  /** Avance d'un tour : mouvement + événements + commentaires agents. */
  step(state: TacticalState): TacticalState {
    const scenario = getScenario(state.scenarioId);
    const advanced = advanceTurn(state, scenario);
    if (advanced.turn === state.turn) {
      // Aucun tour avancé (déjà terminé) : on n'ajoute rien.
      return this.enrich(advanced);
    }
    return this.enrich(this.addTurnCommentary(advanced));
  }

  /** Traite une instruction libre du joueur. */
  runInstruction(state: TacticalState, instruction: string): TacticalState {
    return this.enrich(this.runtime.runInstruction(state, instruction));
  }

  /** Exécute une action suggérée. */
  runSuggestedAction(
    state: TacticalState,
    action: SuggestedAction,
  ): TacticalState {
    return this.enrich(this.runtime.runSuggestedAction(state, action));
  }

  /** Pose le diagnostic final : score + débrief, état marqué terminé. */
  diagnose(state: TacticalState, diagnosis: PlayerDiagnosis): DiagnoseResult {
    const scenario = getScenario(state.scenarioId);
    const score = scoreDiagnosis(diagnosis, scenario, state);
    const debrief = buildDebrief(diagnosis, scenario, state, score);
    return {
      state: { ...state, status: "completed", diagnosis },
      score,
      debrief,
    };
  }

  /** Recalcule suggestions + focus visuel. */
  private enrich(state: TacticalState): TacticalState {
    return applyVisualFocus(applySuggestions(state));
  }

  /** Ajoute un message d'agent pour chaque événement du tour courant. */
  private addTurnCommentary(state: TacticalState): TacticalState {
    const turnEvents = state.events.filter((e) => e.turn === state.turn);
    const messages: AgentMessage[] = [];

    for (const event of turnEvents) {
      const agentId = AGENT_FOR_EVENT[event.type];
      if (!agentId) continue;

      const agent = AGENTS_BY_ID[agentId];
      const message = event.contactId
        ? agent.analyze(state, event.contactId)
        : gameMasterAgent.analyze(state);

      if (message) {
        messages.push({ ...message, id: `${message.id}#auto${messages.length}` });
      }
    }

    return { ...state, agentMessages: [...state.agentMessages, ...messages] };
  }
}

/** Instance partagée. */
export const simulationController = new SimulationController();
