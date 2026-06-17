import type {
  AgentId,
  AgentMessage,
  PlayerAction,
  SuggestedAction,
  TacticalState,
} from "@/types";
import { AGENTS_BY_ID, gameMasterAgent } from "@/core/agents";
import { detectAgent, detectContact, pickContact } from "./routing";

export type Routing = { agentId: AgentId; contactId?: string };

/**
 * AgentRuntime — orchestration human-in-the-loop. Route une instruction joueur
 * vers le bon agent, déclenche son analyse (grounded sur TacticalState via MCP +
 * skills) et ajoute la réponse à l'état. Les agents n'inventent aucun fait : la
 * réponse provient toujours de l'état tactique.
 */
export class AgentRuntime {
  /** Détermine l'agent et le contact ciblés par une instruction libre. */
  routeInstruction(state: TacticalState, instruction: string): Routing {
    return {
      agentId: detectAgent(instruction) ?? "game-master-agent",
      contactId: detectContact(instruction, state) ?? pickContact(state),
    };
  }

  /** Traite une instruction libre et renvoie l'état enrichi. */
  runInstruction(state: TacticalState, instruction: string): TacticalState {
    const { agentId, contactId } = this.routeInstruction(state, instruction);
    const message = this.buildMessage(state, agentId, contactId);

    const playerAction: PlayerAction = {
      id: `pa-t${state.turn}-${state.playerActions.length}`,
      turn: state.turn,
      type: "free_instruction",
      instruction,
      targetAgentId: agentId,
      skillName: message.usedSkills[0],
    };

    return this.appendResponse(state, message, playerAction);
  }

  /** Exécute une action suggérée et renvoie l'état enrichi. */
  runSuggestedAction(
    state: TacticalState,
    action: SuggestedAction,
  ): TacticalState {
    const agentId: AgentId =
      action.targetAgentId in AGENTS_BY_ID
        ? (action.targetAgentId as AgentId)
        : "game-master-agent";
    const contactId =
      detectContact(action.promptTemplate, state) ?? pickContact(state);
    const message = this.buildMessage(state, agentId, contactId);

    const playerAction: PlayerAction = {
      id: `pa-t${state.turn}-${state.playerActions.length}`,
      turn: state.turn,
      type: "suggested_action",
      instruction: action.label,
      targetAgentId: agentId,
      skillName: action.skillName,
    };

    return this.appendResponse(state, message, playerAction);
  }

  /** Construit un message grounded, avec repli sur la narration GameMaster. */
  private buildMessage(
    state: TacticalState,
    agentId: AgentId,
    contactId: string | undefined,
  ): AgentMessage {
    const agent = AGENTS_BY_ID[agentId];

    let message: AgentMessage | null = null;
    if (contactId) message = agent.analyze(state, contactId);
    if (!message) message = gameMasterAgent.analyze(state, contactId);

    if (!message) {
      // Repli ultime (aucun événement) : message générique du GameMaster.
      message = {
        id: "game-master-agent",
        turn: state.turn,
        agentId: "game-master-agent",
        agentName: "GameMasterAgent",
        message:
          "Je n'ai pas encore d'élément précis à analyser. Continue d'observer la situation.",
        referencedContacts: [],
        usedSkills: [],
        timestamp: `t+${state.turn}`,
      };
    }

    // Garantit un identifiant unique même pour plusieurs messages au même tour.
    return { ...message, id: `${message.id}#${state.agentMessages.length}` };
  }

  private appendResponse(
    state: TacticalState,
    message: AgentMessage,
    playerAction: PlayerAction,
  ): TacticalState {
    return {
      ...state,
      agentMessages: [...state.agentMessages, message],
      playerActions: [...state.playerActions, playerAction],
    };
  }
}

/** Instance partagée. */
export const agentRuntime = new AgentRuntime();
