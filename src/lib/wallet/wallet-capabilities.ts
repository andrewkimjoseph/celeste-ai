type EthereumProvider = {
  isMiniPay?: boolean;
};

/** True when running inside MiniPay (Celo fee abstraction — gas from stables). */
export function isMiniPayWallet(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return Boolean(ethereum?.isMiniPay);
}

export type WalletCapabilities = {
  supportsFeeAbstraction: boolean;
  blocksCeloSend: boolean;
};

export function getWalletCapabilities(): WalletCapabilities {
  const isMiniPay = isMiniPayWallet();
  return {
    supportsFeeAbstraction: isMiniPay,
    blocksCeloSend: isMiniPay,
  };
}
