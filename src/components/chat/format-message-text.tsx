import type { ReactNode } from "react";
import { isAddress } from "viem";
import { trimTrailingUrlPunctuation } from "@/lib/chat/trim-url-punctuation";

export type MessageTextVariant = "assistant" | "user";

export type HexTokenKind = "address" | "txHash" | "truncatedHash" | "ambiguous";

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|0x[a-fA-F0-9]{40,}|0x[a-fA-F0-9]{4,}…[a-fA-F0-9]{4,}|https?:\/\/[^\s]+)/g;

const TRUNCATED_HASH_PATTERN = /^0x[a-fA-F0-9]{4,}…[a-fA-F0-9]{4,}$/;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

export function classifyHexToken(token: string): HexTokenKind {
  if (TRUNCATED_HASH_PATTERN.test(token)) {
    return "truncatedHash";
  }
  if (TX_HASH_PATTERN.test(token)) {
    return "txHash";
  }
  if (isAddress(token)) {
    return "address";
  }
  return "ambiguous";
}

export function isClickableHexToken(token: string): boolean {
  const kind = classifyHexToken(token);
  return kind === "address" || kind === "txHash" || kind === "truncatedHash";
}

interface FormatOptions {
  variant?: MessageTextVariant;
  keyPrefix?: string;
  onHashClick?: (hash: string) => void;
  copiedToken?: string | null;
}

function parseInline(text: string, options: FormatOptions = {}): ReactNode[] {
  const {
    variant = "assistant",
    keyPrefix = "inline",
    onHashClick,
    copiedToken,
  } = options;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const boldClass = "font-bold text-[var(--ink)]";

  const linkClass =
    variant === "user"
      ? "text-[var(--ink)] underline decoration-[var(--ink)]/50 underline-offset-2 hover:decoration-[var(--ink)]"
      : "text-[var(--celo-forest)] underline decoration-[var(--celo-forest)]/50 underline-offset-2 hover:decoration-[var(--celo-forest)]";

  const codeClass =
    variant === "user"
      ? "rounded-[2px] bg-black/10 px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--ink)]"
      : "rounded-[2px] bg-[var(--canvas)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--ink)]";

  const hashClass =
    variant === "user"
      ? "break-all rounded-[2px] bg-black/10 px-1.5 py-0.5 font-mono text-[0.8em] text-[var(--ink)] ring-1 ring-[var(--ink)]/20"
      : "break-all rounded-[2px] bg-[var(--canvas)] px-1 py-0.5 font-mono text-[0.8em] text-[var(--ink)] ring-1 ring-[var(--ink)]/20";

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-${key++}`} className={boldClass}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={`${keyPrefix}-${key++}`} className="italic opacity-95">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-${key++}`} className={codeClass}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("0x")) {
      if (isClickableHexToken(token) && onHashClick) {
        const copied = copiedToken === token;
        nodes.push(
          <button
            key={`${keyPrefix}-${key++}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onHashClick(token);
            }}
            className={`${hashClass} cursor-pointer transition-colors ${
              variant === "user"
                ? "hover:bg-black/15"
                : "hover:text-[var(--celo-forest)]"
            } ${copied ? "ring-[var(--ink)]/40" : ""}`}
            title={copied ? "Copied" : "Copy to clipboard"}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
          >
            {token}
          </button>,
        );
      } else {
        nodes.push(
          <span key={`${keyPrefix}-${key++}`} className={hashClass}>
            {token}
          </span>,
        );
      }
    } else {
      const { href, trailing } = trimTrailingUrlPunctuation(token);
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {href}
        </a>,
      );
      if (trailing) {
        nodes.push(trailing);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function isListBlock(block: string): boolean {
  const lines = block.split("\n").filter((line) => line.trim().length > 0);
  return lines.length > 0 && lines.every((line) => /^-\s+/.test(line.trim()));
}

function renderListBlock(
  block: string,
  options: FormatOptions,
  blockKey: string,
): ReactNode {
  const lines = block.split("\n").filter((line) => line.trim().length > 0);

  return (
    <ul
      key={blockKey}
      className="ml-1 list-none space-y-1.5 pl-0 [&>li]:relative [&>li]:pl-4 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:size-1.5 [&>li]:before:rounded-[2px] [&>li]:before:bg-[var(--ink)] [&>li]:before:content-['']"
    >
      {lines.map((line, index) => (
        <li key={`${blockKey}-${index}`} className="leading-relaxed">
          {parseInline(line.replace(/^-\s+/, ""), {
            ...options,
            keyPrefix: `${blockKey}-li-${index}`,
          })}
        </li>
      ))}
    </ul>
  );
}

export function formatMessageText(
  text: string,
  options: FormatOptions = {},
): ReactNode[] {
  const blocks = text.split(/\n{2,}/).filter((block) => block.trim().length > 0);

  if (blocks.length === 0) {
    return [];
  }

  return blocks.map((block, index) => {
    const blockKey = `block-${index}`;

    if (isListBlock(block)) {
      return renderListBlock(block, options, blockKey);
    }

    const lines = block.split("\n");

    return (
      <p key={blockKey} className="leading-[1.65]">
        {lines.map((line, lineIndex) => (
          <span key={`${blockKey}-line-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {parseInline(line, {
              ...options,
              keyPrefix: `${blockKey}-line-${lineIndex}`,
            })}
          </span>
        ))}
      </p>
    );
  });
}
