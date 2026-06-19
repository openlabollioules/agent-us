import type { ChatMessage, LLMProvider, LLMProviderId } from "@/types";

export type OpenAICompatibleOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Injectable pour les tests (par défaut : fetch global). */
  fetchImpl?: typeof fetch;
};

const DEFAULTS = {
  temperature: 0.4,
  maxTokens: 512,
  timeoutMs: 15_000,
} as const;

/**
 * Client unique pour tous les backends compatibles OpenAI (hermes, vllm,
 * openrouter) : seuls l'URL de base, le modèle et la clé changent. Hermes
 * expose son API agentique via ce même endpoint `/chat/completions`.
 * Inclut un timeout (AbortController) pour ne jamais bloquer l'UI.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    public readonly id: LLMProviderId,
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly apiKey: string = "EMPTY",
    private readonly options: OpenAICompatibleOptions = {},
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const timeoutMs = this.options.timeoutMs ?? DEFAULTS.timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(
        `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: this.options.temperature ?? DEFAULTS.temperature,
            max_tokens: this.options.maxTokens ?? DEFAULTS.maxTokens,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `${this.id} request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return data.choices?.[0]?.message?.content ?? "";
    } finally {
      clearTimeout(timeout);
    }
  }
}
