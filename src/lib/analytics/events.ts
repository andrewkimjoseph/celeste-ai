import { isToolUIPart, type UIMessage } from "ai";

export type CharLengthBucket = "0-50" | "51-200" | "200+";

export type ChatMessageSource = "composer" | "suggestion";

export type PromptGroup = "Send" | "Swap" | "FX" | "Earn" | "GoodDollar";

export type FlowCategory =
  | "send"
  | "swap"
  | "mento_fx"
  | "aave"
  | "gooddollar"
  | "other";

export type AnalyticsEventMap = {
  app_opened: { environment: "development" | "production" };
  wallet_connected: { connector: string; is_minipay: boolean };
  wallet_disconnected: Record<string, never>;
  chat_message_sent: {
    source: ChatMessageSource;
    char_length_bucket: CharLengthBucket;
    prompt_group?: PromptGroup;
  };
  chat_response_finished: {
    duration_ms: number;
    had_tool_calls: boolean;
    had_prepare_flow: boolean;
  };
  chat_error: { error_category: string };
  new_chat_started: Record<string, never>;
  tx_card_shown: { step_count: number; flow_category: FlowCategory };
  tx_confirm_clicked: { step_count: number; flow_category: FlowCategory };
  tx_confirmed: {
    step_count: number;
    hash_count: number;
    flow_category: FlowCategory;
  };
  tx_failed: { flow_category: FlowCategory; error_category: string };
  tx_dismissed: { flow_category: FlowCategory };
  transactions_drawer_opened: { transaction_count: number };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export function charLengthBucket(length: number): CharLengthBucket {
  if (length <= 50) {
    return "0-50";
  }
  if (length <= 200) {
    return "51-200";
  }
  return "200+";
}

export function categorizeChatError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("connect your wallet")) {
    return "wallet_required";
  }
  if (lower.includes("openrouter") || lower.includes("openai_api_key")) {
    return "llm_config";
  }
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "rate_limit";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "network";
  }

  return "other";
}

export function categorizeWalletError(title: string): string {
  const lower = title.toLowerCase();

  if (lower.includes("cancelled")) {
    return "user_rejected";
  }
  if (lower.includes("insufficient")) {
    return "insufficient_balance";
  }
  if (lower.includes("wrong network")) {
    return "wrong_network";
  }
  if (lower.includes("unavailable")) {
    return "wallet_unavailable";
  }

  return "other";
}

export function analyzeAssistantResponse(message: UIMessage): {
  had_tool_calls: boolean;
  had_prepare_flow: boolean;
} {
  let hadToolCalls = false;
  let hadPrepareFlow = false;

  for (const part of message.parts ?? []) {
    if (!isToolUIPart(part)) {
      continue;
    }

    hadToolCalls = true;
    const toolName =
      part.type === "dynamic-tool"
        ? part.toolName
        : part.type.replace("tool-", "");
    if (toolName.startsWith("prepare_")) {
      hadPrepareFlow = true;
    }
  }

  return {
    had_tool_calls: hadToolCalls,
    had_prepare_flow: hadPrepareFlow,
  };
}
