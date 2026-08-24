"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

const headerChipClassName =
  "flex items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:rounded-lg";

function AccountAvatar({
  ensAvatar,
  displayName,
}: {
  ensAvatar?: string;
  displayName: string;
}) {
  if (ensAvatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ENS avatar from wallet
      <img
        src={ensAvatar}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 rounded-full object-cover"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-semibold uppercase text-[var(--text-secondary)]"
      aria-hidden
    >
      {displayName.slice(0, 2)}
    </span>
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
              className={`${headerChipClassName} px-3 py-1.5 text-xs text-red-400 hover:text-red-300`}
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
              className={`${headerChipClassName} size-9 sm:hidden`}
            >
              <AccountAvatar
                ensAvatar={account.ensAvatar}
                displayName={account.displayName}
              />
            </button>

            <div className="hidden items-center gap-1.5 sm:flex">
              {chain ? (
                <button
                  type="button"
                  onClick={openChainModal}
                  aria-label={`Network: ${chain.name ?? chain.id}`}
                  className={`${headerChipClassName} size-9`}
                >
                  {chain.hasIcon && chain.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- chain icon from RainbowKit
                    <img
                      src={chain.iconUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="size-4 shrink-0 rounded-full object-cover"
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
                className={`${headerChipClassName} gap-2 px-3 py-1.5 text-xs`}
              >
                {account.ensAvatar ? (
                  <AccountAvatar
                    ensAvatar={account.ensAvatar}
                    displayName={account.displayName}
                  />
                ) : null}
                <span className="max-w-[7rem] truncate">{account.displayName}</span>
              </button>
            </div>
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
