"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { CelesteGlobeMark } from "@/components/celeste-logo";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

const CAPABILITIES = [
  {
    label: "Send",
    description: "Stablecoins and tokens on Celo",
  },
  {
    label: "Swap",
    description: "Mento, reserve, and Uniswap routes",
  },
  {
    label: "Earn",
    description: "Save and withdraw on Aave V3",
  },
  {
    label: "GoodDollar",
    description: "Claim and manage G$ flows",
  },
] as const;

const STEPS = [
  "Describe the action in chat",
  "Celeste prepares the transaction steps",
  "You review and sign in your wallet",
] as const;

export function PreConnectLanding() {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <CelesteGlobeMark className="mb-4 sm:mb-5" />
      <h2 className="text-2xl font-medium tracking-tight text-[var(--text-primary)] sm:text-3xl">
        Your cosmic copilot for Celo
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
        Connect, ask in plain language, and Celeste helps you send, swap, earn,
        and claim across the Celo ecosystem.
      </p>

      <ul className="mt-6 grid gap-2 text-left sm:grid-cols-2">
        {CAPABILITIES.map((capability) => (
          <li
            key={capability.label}
            className="rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)]/50 px-3 py-2.5"
          >
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {capability.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">
              {capability.description}
            </p>
          </li>
        ))}
      </ul>

      <ol className="mt-5 flex flex-col gap-1.5 text-left sm:flex-row sm:items-start sm:justify-center sm:gap-4">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-2 text-xs text-[var(--text-secondary)] sm:max-w-[9.5rem] sm:flex-col sm:items-center sm:text-center"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--surface-2)] bg-[var(--surface-0)]/60 text-[10px] font-semibold text-[var(--text-muted)] sm:mt-0">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-col items-center gap-3">
        <ConnectWalletButton
          onClick={() => openConnectModal?.()}
          disabled={!openConnectModal}
        />
        <Link
          href="/about"
          className="text-xs text-[var(--accent-soft-text)] transition-colors hover:text-[var(--text-primary)]"
        >
          Learn more about Celeste
        </Link>
      </div>

      <p className="mt-4 text-[11px] leading-4 text-[var(--text-subtle)]">
        Celeste never auto-sends — you review and sign every transaction.
      </p>
    </div>
  );
}
