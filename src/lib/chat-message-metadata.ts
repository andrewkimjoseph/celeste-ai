import type { UIMessage } from "ai";
import { z } from "zod";

export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type CelesteUIMessage = UIMessage<MessageMetadata>;

export const MESSAGE_TIMESTAMP_CLASS =
  "text-[11px] font-normal tabular-nums text-zinc-500";

export function getMessageCreatedAt(
  message: Pick<CelesteUIMessage, "metadata">,
): number | undefined {
  const parsed = messageMetadataSchema.safeParse(message.metadata);
  return parsed.success ? parsed.data.createdAt : undefined;
}

/** Clock time for same-day messages; short date + time for older. */
export function formatMessageTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function createMessageMetadata(): MessageMetadata {
  return { createdAt: Date.now() };
}
