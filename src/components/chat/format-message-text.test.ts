import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  classifyHexToken,
  formatMessageText,
  isClickableHexToken,
} from "@/components/chat/format-message-text";

const ADDRESS = "0x5279a74f72262347b1ca3083beb178d037178c9e";
const TX_HASH =
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const TRUNCATED_HASH = "0x1234…abcd";

type HexElement = {
  tag: string;
  text: string;
  onClick?: unknown;
};

function collectHexElements(node: ReactNode, out: HexElement[] = []): HexElement[] {
  if (node == null || typeof node === "boolean") {
    return out;
  }

  if (typeof node === "string" || typeof node === "number") {
    return out;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      collectHexElements(child, out);
    }
    return out;
  }

  if (!isValidElement(node)) {
    return out;
  }

  const tag = typeof node.type === "string" ? node.type : "component";
  const children = node.props.children as ReactNode;

  if (tag === "button" || tag === "span") {
    const text =
      typeof children === "string"
        ? children
        : Array.isArray(children)
          ? children.filter((child) => typeof child === "string").join("")
          : "";

    if (text.startsWith("0x")) {
      out.push({
        tag,
        text,
        onClick: node.props.onClick,
      });
    }
  }

  Children.forEach(children, (child) => {
    collectHexElements(child, out);
  });

  return out;
}

describe("classifyHexToken", () => {
  it("classifies 40-char wallet addresses", () => {
    expect(classifyHexToken(ADDRESS)).toBe("address");
    expect(isClickableHexToken(ADDRESS)).toBe(true);
  });

  it("classifies 64-char transaction hashes", () => {
    expect(classifyHexToken(TX_HASH)).toBe("txHash");
    expect(isClickableHexToken(TX_HASH)).toBe(true);
  });

  it("classifies truncated hashes", () => {
    expect(classifyHexToken(TRUNCATED_HASH)).toBe("truncatedHash");
    expect(isClickableHexToken(TRUNCATED_HASH)).toBe(true);
  });

  it("classifies ambiguous hex lengths as non-clickable", () => {
    const ambiguous = "0xabcdef1234567890abcdef1234567890abcdef123";
    expect(classifyHexToken(ambiguous)).toBe("ambiguous");
    expect(isClickableHexToken(ambiguous)).toBe(false);
  });
});

describe("formatMessageText hex rendering", () => {
  it("renders addresses as clickable buttons when onHashClick is provided", () => {
    const onHashClick = vi.fn();
    const nodes = formatMessageText(`Check ${ADDRESS}`, { onHashClick });
    const hexElements = collectHexElements(nodes);

    expect(hexElements).toHaveLength(1);
    expect(hexElements[0]?.tag).toBe("button");
    expect(hexElements[0]?.text).toBe(ADDRESS);
    expect(hexElements[0]?.onClick).toBeTypeOf("function");

    hexElements[0]?.onClick?.({ stopPropagation: vi.fn() });
    expect(onHashClick).toHaveBeenCalledWith(ADDRESS);
  });

  it("renders tx hashes as clickable buttons when onHashClick is provided", () => {
    const onHashClick = vi.fn();
    const nodes = formatMessageText(`Tx: ${TX_HASH}`, { onHashClick });
    const hexElements = collectHexElements(nodes);

    expect(hexElements).toHaveLength(1);
    expect(hexElements[0]?.tag).toBe("button");
    expect(hexElements[0]?.text).toBe(TX_HASH);
    expect(hexElements[0]?.onClick).toBeTypeOf("function");

    hexElements[0]?.onClick?.({ stopPropagation: vi.fn() });
    expect(onHashClick).toHaveBeenCalledWith(TX_HASH);
  });

  it("renders truncated hashes as clickable buttons", () => {
    const onHashClick = vi.fn();
    const nodes = formatMessageText(`Tx: ${TRUNCATED_HASH}`, { onHashClick });
    const hexElements = collectHexElements(nodes);

    expect(hexElements).toHaveLength(1);
    expect(hexElements[0]?.tag).toBe("button");
    expect(hexElements[0]?.text).toBe(TRUNCATED_HASH);

    hexElements[0]?.onClick?.({ stopPropagation: vi.fn() });
    expect(onHashClick).toHaveBeenCalledWith(TRUNCATED_HASH);
  });

  it("renders mixed address and hash lines as clickable buttons", () => {
    const onHashClick = vi.fn();
    const nodes = formatMessageText(`Wallet ${ADDRESS} sent ${TX_HASH}`, {
      onHashClick,
    });
    const hexElements = collectHexElements(nodes);

    expect(hexElements).toHaveLength(2);
    expect(hexElements[0]).toMatchObject({ tag: "button", text: ADDRESS });
    expect(hexElements[1]).toMatchObject({ tag: "button", text: TX_HASH });
  });
});
