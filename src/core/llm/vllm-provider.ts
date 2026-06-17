import type { ChatMessage, LLMProvider } from "@/types";

export type VLLMOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Injectable pour les tests (par défaut : fetch global). */
  fetchImpl?: typeof fetch;
};

/**
 * VLLMProvider — appelle un serveur vLLM via l'API compatible OpenAI
 * (`/chat/completions`). Inclut un timeout (AbortController) pour ne jamais
 * bloquer l'UI si le serveur ne répond pas.
 */
export class VLLMProvider implements LLMProvider {
  readonly id = "vllm" as const;

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: VLLMOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.model = options.model;
    this.apiKey = options.apiKey ?? "EMPTY";
    this.temperature = options.temperature ?? 0.4;
    this.maxTokens = options.maxTokens ?? 512;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`vLLM request failed: ${response.status}`);
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
