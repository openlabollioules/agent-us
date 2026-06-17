import type { ChatMessage, LLMProvider } from "@/types";
import { MockLLMProvider } from "./mock-provider";

/**
 * Enveloppe un provider pour retomber sur le mock en cas d'échec (réseau,
 * timeout, statut HTTP). Garantit que l'application répond toujours, même si
 * vLLM est indisponible. (Correction du plan : le fallback était spécifié mais
 * non implémenté — le code initial se contentait de throw.)
 */
export function withMockFallback(
  primary: LLMProvider,
  fallback: LLMProvider = new MockLLMProvider(),
): LLMProvider {
  return {
    id: primary.id,
    async chat(messages: ChatMessage[]): Promise<string> {
      try {
        return await primary.chat(messages);
      } catch {
        return fallback.chat(messages);
      }
    },
  };
}
