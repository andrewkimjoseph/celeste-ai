import {
  Identify,
  identify,
  init,
  reset,
  setUserId,
  track,
} from "@amplitude/analytics-browser";
import type {
  AnalyticsEventMap,
  AnalyticsEventName,
} from "@/lib/analytics/events";

let initialized = false;

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AMPLITUDE_DISABLED === "1";
}

function getApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY?.trim();
  return key || undefined;
}

function getServerZone(): "US" | "EU" {
  return process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE === "EU" ? "EU" : "US";
}

function getEnvironment(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

async function hashWalletAddress(address: string): Promise<string> {
  const normalized = address.toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 32);
}

export function initAmplitudeBrowser(): boolean {
  if (typeof window === "undefined" || initialized || isDisabled()) {
    return false;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return false;
  }

  init(apiKey, {
    serverZone: getServerZone(),
    defaultTracking: {
      sessions: true,
      pageViews: false,
    },
    autocapture: false,
  });

  initialized = true;
  return true;
}

export function trackEvent<T extends AnalyticsEventName>(
  name: T,
  properties?: AnalyticsEventMap[T],
): void {
  if (typeof window === "undefined" || isDisabled() || !getApiKey()) {
    return;
  }

  if (!initialized) {
    const ready = initAmplitudeBrowser();
    if (!ready) {
      return;
    }
  }

  try {
    track(name, properties as Record<string, unknown> | undefined);
  } catch {
    // telemetry must not break the app
  }
}

export function trackAppOpened(): void {
  trackEvent("app_opened", { environment: getEnvironment() });
}

export async function setAnalyticsUser(
  walletAddress: string,
  options?: { connector?: string; isMinipay?: boolean },
): Promise<void> {
  if (typeof window === "undefined" || isDisabled() || !getApiKey()) {
    return;
  }

  if (!initialized) {
    const ready = initAmplitudeBrowser();
    if (!ready) {
      return;
    }
  }

  try {
    const hashedId = await hashWalletAddress(walletAddress);
    setUserId(hashedId);

    const identifyObj = new Identify();
    if (options?.connector) {
      identifyObj.set("wallet_connector", options.connector);
    }
    if (options?.isMinipay !== undefined) {
      identifyObj.set("is_minipay", options.isMinipay);
    }
    identify(identifyObj);
  } catch {
    // telemetry must not break the app
  }
}

export function resetAnalytics(): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  try {
    reset();
  } catch {
    // telemetry must not break the app
  }
}
