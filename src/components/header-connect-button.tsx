"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

const headerChipClassName =
  "flex h-9 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

function WalletIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
      />
    </svg>
  );
}

function AccountAvatar({ ensAvatar }: { ensAvatar: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ENS avatar from wallet
    <img
      src={ensAvatar}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 rounded-[2px] border border-[var(--ink)] object-cover"
      aria-hidden
    />
  );
}

export function HeaderConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        if (!mounted) {
          return null;
        }

        if (!account) {
          return <ConnectWalletButton onClick={openConnectModal} />;
        }

        if (chain?.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`${headerChipClassName} bg-[var(--accent)] px-3 text-xs text-[var(--accent-foreground)]`}
            >
              Wrong network
            </button>
          );
        }

        return (
          <>
            <button
              type="button"
              onClick={openAccountModal}
              aria-label={`Account: ${account.displayName}`}
              className={`${headerChipClassName} w-9 sm:hidden`}
            >
              {account.ensAvatar ? (
                <AccountAvatar ensAvatar={account.ensAvatar} />
              ) : (
                <WalletIcon />
              )}
            </button>

            <div className="hidden items-center gap-1.5 sm:flex">
              {chain ? (
                <button
                  type="button"
                  onClick={openChainModal}
                  aria-label={`Network: ${chain.name ?? chain.id}`}
                  className={`${headerChipClassName} w-9`}
                >
                  {chain.hasIcon && chain.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- chain icon from RainbowKit
                    <img
                      src={chain.iconUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4 shrink-0 object-cover"
                      aria-hidden
                    />
                  ) : (
                    <span className="text-[10px] font-semibold">
                      {chain.name?.slice(0, 1) ?? "?"}
                    </span>
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={openAccountModal}
                aria-label={`Account: ${account.displayName}`}
                className={`${headerChipClassName} gap-2 px-3 text-xs`}
              >
                {account.ensAvatar ? (
                  <AccountAvatar ensAvatar={account.ensAvatar} />
                ) : (
                  <WalletIcon />
                )}
                <span className="max-w-[7rem] truncate">{account.displayName}</span>
              </button>
            </div>
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
