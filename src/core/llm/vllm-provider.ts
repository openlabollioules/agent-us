import { OpenAICompatibleProvider } from "./openai-compatible-provider";

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
 * VLLMProvider — client vLLM (API compatible OpenAI). Conserve sa signature
 * historique ; s'appuie désormais sur OpenAICompatibleProvider.
 */
export class VLLMProvider extends OpenAICompatibleProvider {
  constructor(options: VLLMOptions) {
    super("vllm", options.baseUrl, options.model, options.apiKey ?? "EMPTY", {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      timeoutMs: options.timeoutMs,
      fetchImpl: options.fetchImpl,
    });
  }
}
