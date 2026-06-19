import type { AgentMessage, ChatMessage, LLMProvider } from "@/types";

/**
 * Reformule un constat déterministe en message d'agent, SANS inventer de fait.
 * Dégradation gracieuse : si aucun provider n'est configuré ou si le backend
 * échoue, on renvoie le texte déterministe d'origine inchangé.
 */
const SYSTEM_PROMPT = [
  "Tu es un agent naval pédagogique d'une simulation tactique fictive.",
  "Tu reformules un constat déterministe en une phrase courte, factuelle et lisible.",
  "Tu n'inventes aucun fait, aucune position, aucune action offensive.",
  "Tu n'utilises pas de jargon militaire réel et tu exprimes l'incertitude.",
  "Si le texte source contient déjà tout ce qui est utile, garde-le presque tel quel.",
].join(" ");

export async function verbalize(
  llm: LLMProvider | null,
  deterministicSummary: string,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<string> {
  const fallback = deterministicSummary.trim();
  if (!llm || fallback.length === 0) return fallback;

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: fallback },
    ];
    const result = (await llm.chat(messages)).trim();
    return result.length > 0 ? result : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reformule le champ `.message` d'un lot d'AgentMessage. Tout le reste (id,
 * agent, skills, contacts) est préservé pour permettre un patch par id.
 */
export async function verbalizeMessages(
  llm: LLMProvider | null,
  messages: AgentMessage[],
): Promise<AgentMessage[]> {
  if (!llm || messages.length === 0) return messages;

  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      message: await verbalize(llm, m.message),
    })),
  );
}
