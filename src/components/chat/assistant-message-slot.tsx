import type { ReactNode } from "react";
import { CelesteLogoAvatar } from "@/components/celeste-logo";

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
        <CelesteLogoAvatar
          size="sm"
          className="mt-1 shadow-sm ring-2 ring-[var(--accent)]/15"
        />
      ) : (
        <div className="mt-1 size-7 shrink-0 sm:size-8" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        {showLabel && showAvatar ? (
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-zinc-500">
            Celeste
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function AssistantColumn({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 md:w-1/2 md:pr-4 lg:pr-6">{children}</div>
  );
}
