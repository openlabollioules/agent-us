import type { AgentDefinition, AgentMessage, TacticalState } from "@/types";

/** Contenu d'une réponse d'agent avant emballage en AgentMessage. */
export type AgentReply = {
  message: string;
  confidence?: number;
  referencedContacts?: string[];
  usedSkills?: string[];
};

/**
 * Agent de base. En mode mock, un agent interprète TacticalState via ses MCP et
 * ses skills, et produit un message déterministe. Il n'invente jamais de faits
 * tactiques et exprime toujours l'incertitude.
 */
export abstract class BaseAgent {
  constructor(readonly definition: AgentDefinition) {}

  /**
   * Produit un message d'analyse pour un contact, ou `null` si le contact
   * n'existe pas / n'est pas pertinent pour cet agent.
   */
  abstract analyze(state: TacticalState, contactId: string): AgentMessage | null;

  /** Emballe une réponse en AgentMessage (id et horodatage déterministes). */
  protected makeMessage(
    state: TacticalState,
    reply: AgentReply,
    contactId?: string,
  ): AgentMessage {
    return {
      id: `${this.definition.id}-t${state.turn}-${contactId ?? "general"}`,
      turn: state.turn,
      agentId: this.definition.id,
      agentName: this.definition.name,
      message: reply.message,
      confidence: reply.confidence,
      referencedContacts:
        reply.referencedContacts ?? (contactId ? [contactId] : []),
      usedSkills: reply.usedSkills ?? [],
      timestamp: `t+${state.turn}`,
    };
  }
}
