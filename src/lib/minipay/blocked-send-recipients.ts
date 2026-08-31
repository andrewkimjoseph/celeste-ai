/** Matches `@andrewkimjoseph/celina-sdk` AAVE_POOL — inlined to avoid client bundle pulling full SDK. */
const AAVE_POOL = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402" as const;

type BlockedSendRecipient = {
  address: `0x${string}`;
  label: string;
  suggestedAction: string;
};

/** Protocol contracts — ERC-20 transfers here do not deposit/swap; use prepare_* instead. */
const BLOCKED_SEND_RECIPIENTS: BlockedSendRecipient[] = [
  {
    address: AAVE_POOL,
    label: "Aave V3 Pool",
    suggestedAction:
      "To supply on Aave, use prepare_aave_supply — sending tokens to the pool address does not supply and may lose funds.",
  },
  {
    address: "0xcb695bc5d3aa22cad1e6df07801b061a05a0233a",
    label: "Uniswap Universal Router",
    suggestedAction:
      "To swap on Uniswap, use prepare_swap or prepare_uniswap_swap — not prepare_send.",
  },
];

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function findBlockedSendRecipient(
  address: string,
): BlockedSendRecipient | undefined {
  const normalized = normalizeAddress(address);
  return BLOCKED_SEND_RECIPIENTS.find(
    (entry) => normalizeAddress(entry.address) === normalized,
  );
}

export function checkBlockedSendRecipient(address: string): {
  ok: boolean;
  message?: string;
} {
  const blocked = findBlockedSendRecipient(address);
  if (!blocked) {
    return { ok: true };
  }

  return {
    ok: false,
    message: `${blocked.label} cannot receive direct token transfers. ${blocked.suggestedAction}`,
  };
}

/** Extract recipient from prepared send summary: "Send 52 USDT to 0x…". */
export function parseSendRecipient(summary: string): `0x${string}` | null {
  const match = summary.match(/\bto\s+(0x[a-fA-F0-9]{40})\b/i);
  if (!match?.[1]) {
    return null;
  }
  return match[1] as `0x${string}`;
}
