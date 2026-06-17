import type { LLMProvider } from "@/types";
import { MockLLMProvider } from "./mock-provider";
import { VLLMProvider } from "./vllm-provider";
import { withMockFallback } from "./fallback";

export type LLMConfig = {
  provider?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
};

/** Lit la configuration LLM depuis les variables d'environnement. */
export function readEnvConfig(): LLMConfig {
  return {
    provider: process.env.LLM_PROVIDER,
    baseUrl: process.env.VLLM_BASE_URL,
    model: process.env.VLLM_MODEL,
    apiKey: process.env.LLM_API_KEY,
  };
}

/**
 * Crée le provider LLM actif selon la configuration.
 * - `mock` (défaut) : réponses déterministes.
 * - `vllm` : appelle vLLM, avec fallback mock automatique en cas d'échec.
 * - `claude` / `openai` : non implémentés en V1 → fallback mock.
 * Une configuration vLLM incomplète retombe également sur le mock.
 */
export function createProvider(config: LLMConfig = readEnvConfig()): LLMProvider {
  const provider = config.provider ?? "mock";

  if (provider === "vllm") {
    if (!config.baseUrl || !config.model) {
      return new MockLLMProvider();
    }
    return withMockFallback(
      new VLLMProvider({
        baseUrl: config.baseUrl,
        model: config.model,
        apiKey: config.apiKey,
      }),
    );
  }

  // claude / openai : optionnels, non implémentés en V1.
  return new MockLLMProvider();
}
