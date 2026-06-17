export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type LLMProviderId = "mock" | "vllm" | "claude" | "openai";

export interface LLMProvider {
  id: LLMProviderId;
  chat(messages: ChatMessage[]): Promise<string>;
}
