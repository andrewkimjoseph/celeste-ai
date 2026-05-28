import type { ReactNode } from "react";
import { CelinaLogoAvatar } from "@/components/celina-logo";

interface AssistantMessageSlotProps {
  children: ReactNode;
  showAvatar?: boolean;
  showLabel?: boolean;
}

export function AssistantMessageSlot({
  children,
  showAvatar = true,
  showLabel = true,
}: AssistantMessageSlotProps) {
  return (
    <div className="flex w-full gap-2.5 sm:gap-3">
      {showAvatar ? (
        <CelinaLogoAvatar
          size="sm"
          className="mt-1 shadow-sm ring-2 ring-emerald-500/15"
        />
      ) : (
        <div className="mt-1 size-7 shrink-0 sm:size-8" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {showLabel && showAvatar ? (
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-zinc-500">
            Celina
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function AssistantColumn({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
      <div className="order-2 min-w-0 md:order-1">{children}</div>
    </div>
  );
}
