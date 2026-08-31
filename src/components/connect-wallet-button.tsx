"use client";

interface ConnectWalletButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ConnectWalletButton({
  onClick,
  disabled = false,
  className = "",
}: ConnectWalletButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-brutal btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      Connect wallet
    </button>
  );
}
