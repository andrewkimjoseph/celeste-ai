import type { SerializedPreparedFlow, PreparedTx } from "@andrewkimjoseph/celina-sdk";
import { isToolUIPart, type UIMessage } from "ai";

const PREPARE_TOOL_PREFIX = "prepare_";

/** Type guard for `SerializedPreparedFlow` objects from prepare_* tool outputs. */
export function isPreparedFlow(value: unknown): value is SerializedPreparedFlow {
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
  flow: SerializedPreparedFlow;
  flowKey: string;
  messageId: string;
  toolCallId: string;
};

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
export function extractPreparedFlows(messages: UIMessage[]): SerializedPreparedFlow[] {
  return extractPreparedFlowMetas(messages).map((meta) => meta.flow);
}

/** Return the most recent prepared flow, if any — used to show `TxConfirmCard`. */
export function getLatestPreparedFlow(
  messages: UIMessage[],
): SerializedPreparedFlow | undefined {
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
      return undefined;
    }
  }

  return meta;
}

export type { PreparedTx, SerializedPreparedFlow };
