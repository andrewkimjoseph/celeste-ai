"use client";

import type { FlowPreflightResult } from "@/lib/tx/flow-preflight";
import { parseSupplySummary } from "@/lib/tx/flow-preflight";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { useEffect, useState } from "react";

type FlowPreflightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: FlowPreflightResult }
  | { status: "error"; message: string };

export function useFlowPreflight(
  address: string | undefined,
  summary: string,
): FlowPreflightState {
  const { supportsFeeAbstraction } = useWalletCapabilities();
  const [state, setState] = useState<FlowPreflightState | null>(null);
  const isSupplyFlow = parseSupplySummary(summary) !== null;
  const enabled = Boolean(address && isSupplyFlow && supportsFeeAbstraction);

  useEffect(() => {
    if (!enabled || !address) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setState({ status: "loading" });

      try {
        const res = await fetch("/api/flow-preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, summary, supportsFeeAbstraction }),
        });
        const data = (await res.json()) as FlowPreflightResult & {
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
  }, [address, summary, supportsFeeAbstraction, enabled]);

  if (!enabled) {
    return { status: "idle" };
  }

  return state ?? { status: "loading" };
}
