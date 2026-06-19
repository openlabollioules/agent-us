import type { LLMProvider } from "@/types";
import { MockLLMProvider } from "./mock-provider";
import { VLLMProvider } from "./vllm-provider";
import { OpenAICompatibleProvider } from "./openai-compatible-provider";
import { withMockFallback } from "./fallback";

export type LLMEnv = Partial<Record<string, string | undefined>>;

/**
 * Crée le backend de **verbalisation** depuis l'environnement.
 *
 * `null` = mode déterministe (aucun backend) : les messages d'agents restent
 * tels quels. Sinon, un client OpenAI-compatible pointant vers Hermes / vLLM /
 * OpenRouter. C'est ce provider qu'utilise la route `/api/llm/verbalize` —
 * volontairement SANS fallback mock (verbalize() retombe déjà sur le texte
 * déterministe en cas d'erreur, sans le remplacer par du texte générique).
 */
export function createVerbalizeProvider(
  env: LLMEnv = process.env,
): LLMProvider | null {
  const provider = (env.LLM_PROVIDER ?? "").trim().toLowerCase();

  if (provider === "hermes") {
    return new OpenAICompatibleProvider(
      "hermes",
      env.HERMES_BASE_URL ?? "http://localhost:8642/v1",
      env.HERMES_MODEL ?? "hermes-agent",
      env.HERMES_API_KEY ?? "EMPTY",
    );
  }

  if (provider === "vllm") {
    return new OpenAICompatibleProvider(
      "vllm",
      env.VLLM_BASE_URL ?? "http://localhost:8000/v1",
      env.VLLM_MODEL ?? "Qwen/Qwen3-30B-A3B",
      env.LLM_API_KEY ?? "EMPTY",
    );
  }

  if (provider === "openrouter") {
    return new OpenAICompatibleProvider(
      "openrouter",
      env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      env.OPENROUTER_MODEL ?? "qwen/qwen3-30b-a3b",
      env.LLM_API_KEY ?? "",
    );
  }

  return null;
}

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
