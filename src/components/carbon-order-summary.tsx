import type { CarbonOrderDisplay } from "@/lib/carbon-order-display";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-right text-xs font-medium text-zinc-200">{value}</dd>
    </div>
  );
}

export function CarbonOrderSummary({
  details,
}: {
  details: CarbonOrderDisplay;
}) {
  return (
    <dl className="mt-3 space-y-1.5 rounded-lg border border-[var(--warn)]/20 bg-black/20 px-3 py-2.5">
      <DetailRow label="Pair" value={details.pairLabel} />
      <DetailRow label="Type" value={details.orderType} />
      {details.direction && (
        <DetailRow
          label="Direction"
          value={details.direction === "buy" ? "Buy" : "Sell"}
        />
      )}
      {details.spreadLabel && (
        <DetailRow label="Spread" value={details.spreadLabel} />
      )}
      {details.limitPrice && (
        <DetailRow label="Limit price" value={details.limitPrice} />
      )}
      {details.budget && (
        <DetailRow
          label="Budget"
          value={details.budget}
        />
      )}
      {details.marketPrice && (
        <DetailRow
          label="Market reference"
          value={`${details.marketPrice}${
            details.marketPriceSource === "uniswap_v4" ? " (Uniswap v4)" : ""
          }`}
        />
      )}
      {details.fallbackNote && (
        <p className="pt-1 text-xs leading-relaxed text-amber-100/90">
          {details.fallbackNote}
        </p>
      )}
    </dl>
  );
}
