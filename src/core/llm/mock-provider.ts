import type { ChatMessage, LLMProvider } from "@/types";

/**
 * MockLLMProvider — réponses déterministes sans aucun appel réseau.
 * Mode par défaut : l'application est entièrement jouable sans LLM.
 */
export class MockLLMProvider implements LLMProvider {
  readonly id = "mock" as const;

  async chat(messages: ChatMessage[]): Promise<string> {
    const last = (messages.at(-1)?.content ?? "").toLowerCase();

    if (last.includes("radar")) {
      return "La piste radar est incertaine. Une confirmation par un autre capteur serait utile.";
    }
    if (last.includes("ais")) {
      return "La route observée semble diverger de la route déclarée. À confirmer.";
    }
    if (last.includes("optron") || last.includes("thermi")) {
      return "La signature évoque un petit objet de surface. Classification probable mais incertaine.";
    }
    if (
      last.includes("suspicion") ||
      last.includes("menace") ||
      last.includes("threat")
    ) {
      return "Plusieurs indices convergent, mais la confiance reste à confirmer. L'humain garde la décision.";
    }

    return "Analyse simulée : plusieurs indices doivent être vérifiés avant de conclure.";
  }
}
