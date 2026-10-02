import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_HTTP_REFERER = "https://celeste.usecelina.xyz";

function createChatProvider() {
  return createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      "HTTP-Referer": OPENROUTER_HTTP_REFERER,
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "Celeste AI",
    },
  });
}

let cachedModel: LanguageModel | undefined;

export function getChatModel() {
  if (!cachedModel) {
    const provider = createChatProvider();
    const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENROUTER_MODEL;
    cachedModel = provider.chat(model);
  }
  return cachedModel;
}

export function assertChatApiKeyConfigured(): string | null {
  if (!process.env.OPENROUTER_API_KEY) {
    return "Set OPENROUTER_API_KEY in .env.local.";
  }
  return null;
}
