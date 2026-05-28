import type { ReactNode } from "react";

export type MessageTextVariant = "assistant" | "user";

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|0x[a-fA-F0-9]{40,}|0x[a-fA-F0-9]{4,}…[a-fA-F0-9]{4,}|https?:\/\/[^\s]+)/g;

interface FormatOptions {
  variant?: MessageTextVariant;
  keyPrefix?: string;
  onHashClick?: (hash: string) => void;
}

function parseInline(text: string, options: FormatOptions = {}): ReactNode[] {
  const {
    variant = "assistant",
    keyPrefix = "inline",
    onHashClick,
  } = options;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const boldClass =
    variant === "user"
      ? "font-semibold text-white"
      : "font-semibold text-white";

  const linkClass =
    variant === "user"
      ? "text-emerald-100 underline decoration-emerald-200/50 underline-offset-2 hover:text-white"
      : "text-[var(--accent-hover)] underline decoration-[var(--accent-hover)]/30 underline-offset-2 hover:decoration-[var(--accent-hover)]";

  const codeClass =
    variant === "user"
      ? "rounded bg-black/20 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-50"
      : "rounded bg-black/30 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-100/90";

  const hashClass =
    variant === "user"
      ? "break-all rounded bg-black/15 px-1 py-0.5 font-mono text-[0.8em] text-emerald-50"
      : "break-all rounded bg-black/25 px-1 py-0.5 font-mono text-[0.8em] text-zinc-200";

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
      if (onHashClick) {
        nodes.push(
          <button
            key={`${keyPrefix}-${key++}`}
            type="button"
            onClick={() => onHashClick(token)}
            className={`${hashClass} cursor-pointer transition-colors hover:text-emerald-200`}
            title="View in transactions"
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
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {token}
        </a>,
      );
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
      className="ml-1 list-none space-y-1.5 pl-0 [&>li]:relative [&>li]:pl-4 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.55em] [&>li]:before:size-1 [&>li]:before:rounded-full [&>li]:before:bg-[var(--accent-hover)]/70 [&>li]:before:content-['']"
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
