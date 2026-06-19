import type { AgentMessage } from "@/types";

/**
 * Helper navigateur : envoie un lot de messages à `/api/llm/verbalize` et
 * renvoie les versions reformulées. Repli sur la liste d'entrée en cas
 * d'erreur — le store peut toujours patcher par id sans changer le flux
 * déterministe.
 */
export async function verbalizeMessagesViaApi(
  messages: AgentMessage[],
): Promise<AgentMessage[]> {
  if (messages.length === 0) return messages;
  if (typeof fetch !== "function") return messages;

  try {
    const res = await fetch("/api/llm/verbalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) return messages;
    const data = (await res.json()) as { messages?: AgentMessage[] };
    return Array.isArray(data.messages) ? data.messages : messages;
  } catch {
    return messages;
  }
}
