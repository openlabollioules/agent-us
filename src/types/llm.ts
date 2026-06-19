export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type LLMProviderId =
  | "mock"
  | "vllm"
  | "hermes"
  | "openrouter"
  | "claude"
  | "openai";

export interface LLMProvider {
  readonly id: LLMProviderId;
  chat(messages: ChatMessage[]): Promise<string>;
}
