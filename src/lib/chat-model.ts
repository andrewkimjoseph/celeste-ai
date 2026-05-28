import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function isOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function createChatProvider() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const apiKey = openRouterKey ?? openAiKey;

  const baseURL =
    process.env.OPENAI_BASE_URL ??
    (openRouterKey ? OPENROUTER_BASE_URL : undefined);

  return createOpenAI({
    apiKey,
    baseURL,
    ...(openRouterKey
      ? {
          headers: {
            "HTTP-Referer":
              process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
            "X-Title": process.env.OPENROUTER_APP_NAME ?? "Celina Agent",
          },
        }
      : {}),
  });
}

let cachedModel: LanguageModel | undefined;

export function getChatModel() {
  if (!cachedModel) {
    const provider = createChatProvider();
    const model =
      process.env.OPENAI_MODEL ??
      (isOpenRouter() ? DEFAULT_OPENROUTER_MODEL : DEFAULT_OPENAI_MODEL);
    cachedModel = provider.chat(model);
  }
  return cachedModel;
}

export function assertChatApiKeyConfigured(): string | null {
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    return "Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env.local.";
  }
  return null;
}
