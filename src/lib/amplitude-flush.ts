import { after } from "next/server";

/**
 * Extend the serverless lifecycle so Celina SDK Amplitude events can flush.
 * Required on Vercel until celina-sdk ≥0.4.11 (which flushes per event).
 */
export function scheduleAmplitudeFlush(): void {
  after(async () => {
    try {
      const amplitude = await import("@amplitude/analytics-node");
      await amplitude.flush().promise;
    } catch {
      // telemetry must not break API routes
    }
  });
}
