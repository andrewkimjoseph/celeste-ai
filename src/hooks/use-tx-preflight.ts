"use client";

import type { SendPreflightResult } from "@/lib/tx/send-preflight";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { useEffect, useState } from "react";

type PreflightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: SendPreflightResult }
  | { status: "error"; message: string };

export function useTxPreflight(
  address: string | undefined,
  summary: string,
): PreflightState {
  const { supportsFeeAbstraction, blocksCeloSend } = useWalletCapabilities();
  const [state, setState] = useState<PreflightState | null>(null);

  useEffect(() => {
    if (!address) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setState({ status: "loading" });

      try {
        const res = await fetch("/api/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, summary, supportsFeeAbstraction, blocksCeloSend }),
        });
        const data = (await res.json()) as SendPreflightResult & {
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setState({
            status: "error",
            message: data.error ?? "Balance check failed.",
          });
          return;
        }

        setState({ status: "ready", data });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Could not check balances." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, summary, supportsFeeAbstraction, blocksCeloSend]);

  if (!address) {
    return { status: "idle" };
  }

  return state ?? { status: "loading" };
}
