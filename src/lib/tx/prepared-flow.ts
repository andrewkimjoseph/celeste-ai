import type { SerializedPreparedFlow, PreparedTx } from "@andrewkimjoseph/celina-sdk";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";

const PREPARE_TOOL_PREFIX = "prepare_";

/** Prepared flow with optional extras from prepare tool outputs. */
export type PreparedFlowWithExtras = SerializedPreparedFlow & {
  deep_link?: string;
  warnings?: string[];
};

/** Type guard for `SerializedPreparedFlow` objects from prepare_* tool outputs. */
export function isPreparedFlow(value: unknown): value is PreparedFlowWithExtras {
  return (
    typeof value === "object" &&
    value !== null &&
    "preparedFlow" in value &&
    (value as SerializedPreparedFlow).preparedFlow === true &&
    Array.isArray((value as SerializedPreparedFlow).steps)
  );
}

function isPrepareToolName(toolName: string): boolean {
  return toolName.startsWith(PREPARE_TOOL_PREFIX);
}

type PreparedFlowMeta = {
  flow: PreparedFlowWithExtras;
  flowKey: string;
  messageId: string;
  toolCallId: string;
};

export type { PreparedFlowMeta };

/** Collect prepared flows with stable keys from assistant tool-result parts. */
export function extractPreparedFlowMetas(messages: UIMessage[]): PreparedFlowMeta[] {
  const metas: PreparedFlowMeta[] = [];

  for (const message of messages) {
    if (message.role !== "assistant" || !message.parts) {
      continue;
    }

    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") {
        continue;
      }

      const toolName =
        part.type === "dynamic-tool"
          ? part.toolName
          : part.type.replace("tool-", "");

      if (!isPrepareToolName(toolName)) {
        continue;
      }

      const output = part.output;
      if (!isPreparedFlow(output)) {
        continue;
      }

      metas.push({
        flow: output,
        flowKey: part.toolCallId || `${message.id}-${toolName}`,
        messageId: message.id,
        toolCallId: part.toolCallId,
      });
    }
  }

  return metas;
}

/** Collect all prepared flows from assistant tool-result parts in chat messages. */
export function extractPreparedFlows(messages: UIMessage[]): PreparedFlowWithExtras[] {
  return extractPreparedFlowMetas(messages).map((meta) => meta.flow);
}

/** Return the most recent prepared flow, if any — used to show `TxConfirmCard`. */
export function getLatestPreparedFlow(
  messages: UIMessage[],
): PreparedFlowWithExtras | undefined {
  return extractPreparedFlowMetas(messages).at(-1)?.flow;
}

/** Latest prepared flow plus a stable dismiss key (toolCallId). */
export function getLatestPreparedFlowWithMeta(
  messages: UIMessage[],
): PreparedFlowMeta | undefined {
  return extractPreparedFlowMetas(messages).at(-1);
}

/**
 * Prepared flow to show in `TxConfirmCard` — only while the user has not sent a
 * follow-up message after it was prepared (clarifications, corrections, etc.).
 */
export function getActivePreparedFlowWithMeta(
  messages: UIMessage[],
): PreparedFlowMeta | undefined {
  const meta = getLatestPreparedFlowWithMeta(messages);
  if (!meta) {
    return undefined;
  }

  const preparedIndex = messages.findIndex((message) => message.id === meta.messageId);
  if (preparedIndex === -1) {
    return meta;
  }

  for (let i = preparedIndex + 1; i < messages.length; i++) {
    if (messages[i].role === "user") {
      const text = getMessageText(messages[i]);
      if (isAutoPreparedFlowUserMessage(text)) {
        continue;
      }
      return undefined;
    }
  }

  return meta;
}

/** True after the user signed the wallet confirm card for this prepared flow. */
export function isPreparedFlowConfirmed(
  messages: UIMessage[],
  meta: PreparedFlowMeta,
): boolean {
  const preparedIndex = messages.findIndex((message) => message.id === meta.messageId);
  if (preparedIndex === -1) {
    return false;
  }

  for (let i = preparedIndex + 1; i < messages.length; i++) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }

    const text = getMessageText(message);
    if (text.startsWith(CONFIRMED_TX_PREFIX)) {
      return true;
    }
    if (!isAutoPreparedFlowUserMessage(text)) {
      return false;
    }
  }

  return false;
}

const CONFIRMED_TX_PREFIX = "Transaction confirmed";
const DISMISSED_TX_SNIPPETS = [
  "dismissed the transaction confirmation card",
  "Cancelled signing",
] as const;

function getMessageText(message: UIMessage): string {
  return (
    message.parts
      ?.filter(isTextUIPart)
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

function isAutoPreparedFlowUserMessage(text: string): boolean {
  return (
    text.startsWith(CONFIRMED_TX_PREFIX) ||
    DISMISSED_TX_SNIPPETS.some((snippet) => text.includes(snippet))
  );
}

/** System-generated user messages after signing or dismissing the confirm card — hidden in chat UI. */
export function isAutoPreparedFlowUserMessageText(text: string): boolean {
  return isAutoPreparedFlowUserMessage(text);
}

export function isHiddenChatUserMessage(message: UIMessage): boolean {
  if (message.role !== "user") {
    return false;
  }
  return isAutoPreparedFlowUserMessage(getMessageText(message));
}

/** Whether a prepared flow was signed (messages or persisted hashes). */
export function isPreparedFlowSigned(
  messages: UIMessage[],
  meta: PreparedFlowMeta,
  confirmedFlowHashes: Record<string, string[]>,
): boolean {
  return (
    isPreparedFlowConfirmed(messages, meta) ||
    (confirmedFlowHashes[meta.flowKey]?.length ?? 0) > 0
  );
}

/** All prepared flows that completed on-chain — shown as green cards in chat history. */
export function getSignedPreparedFlowMetas(
  messages: UIMessage[],
  confirmedFlowHashes: Record<string, string[]>,
): PreparedFlowMeta[] {
  return extractPreparedFlowMetas(messages).filter((meta) =>
    isPreparedFlowSigned(messages, meta, confirmedFlowHashes),
  );
}

export function getPreparedFlowMetasForMessage(
  messageId: string,
  metas: PreparedFlowMeta[],
): PreparedFlowMeta[] {
  return metas.filter((meta) => meta.messageId === messageId);
}

function getUserFollowUpsAfterPrepare(
  messages: UIMessage[],
  meta: PreparedFlowMeta,
): string[] {
  const preparedIndex = messages.findIndex((message) => message.id === meta.messageId);
  if (preparedIndex === -1) {
    return [];
  }

  const followUps: string[] = [];
  for (let i = preparedIndex + 1; i < messages.length; i++) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }

    const text = getMessageText(message);
    if (text.length > 0 && !isAutoPreparedFlowUserMessage(text)) {
      followUps.push(text);
    }
  }

  return followUps;
}

/** Hidden LLM context when the user continues without signing a prepared transaction. */
export function buildPreparedFlowClientContext(
  messages: UIMessage[],
): string | undefined {
  const meta = getLatestPreparedFlowWithMeta(messages);
  if (!meta) {
    return undefined;
  }

  if (getActivePreparedFlowWithMeta(messages)) {
    return [
      `The user is sending a new message without signing the wallet confirm card for: "${meta.flow.summary}".`,
      "After this message the card is hidden.",
      "Do not tell them to click Confirm on that card.",
      "Answer their new question.",
      "Only call prepare_* again if they explicitly ask to proceed with the prepared action.",
    ].join(" ");
  }

  const followUps = getUserFollowUpsAfterPrepare(messages, meta);
  if (followUps.length === 0) {
    return undefined;
  }

  return [
    `The wallet confirm card for "${meta.flow.summary}" was not signed and is no longer visible.`,
    "Do not tell the user to click Confirm on an old card.",
    'If they agree to proceed (e.g. "OK", "yes", "go ahead"), call the appropriate prepare_* tool again with the same parameters.',
  ].join(" ");
}

export type { PreparedTx, SerializedPreparedFlow };
