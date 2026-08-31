"use client";

import {
  CELESTIAL_PERSONALITIES,
  type CelestialPersonalityId,
} from "@/lib/chat/celestial-personalities";

interface PersonalityPickerProps {
  selectedId: CelestialPersonalityId | null;
  onSelect: (id: CelestialPersonalityId) => void;
  title?: string;
  description?: string;
  compact?: boolean;
  showHeading?: boolean;
}

export function PersonalityPicker({
  selectedId,
  onSelect,
  title = "Choose your personality",
  description = "This avatar appears next to your messages.",
  compact = false,
  showHeading = true,
}: PersonalityPickerProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {showHeading ? (
        <div>
          <h3
            className={
              compact
                ? "text-xs font-medium text-[var(--text-secondary)]"
                : "text-sm font-semibold text-[var(--text-primary)]"
            }
          >
            {title}
          </h3>
          <p
            className={
              compact
                ? "mt-0.5 text-[11px] text-[var(--text-subtle)]"
                : "mt-1 text-xs text-[var(--text-muted)]"
            }
          >
            {description}
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CELESTIAL_PERSONALITIES.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`min-h-11 min-w-0 overflow-hidden whitespace-normal rounded-[2px] border-2 px-3 py-2.5 text-left transition-transform active:translate-x-[2px] active:translate-y-[2px] ${
                isSelected
                  ? "border-[var(--ink)] bg-[var(--accent)]"
                  : "border-[var(--ink)] bg-[var(--surface)]"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- static personality assets in public */}
                <img
                  src={option.imageSrc}
                  alt=""
                  width={compact ? 32 : 36}
                  height={compact ? 32 : 36}
                  className="size-8 shrink-0 object-contain sm:size-9"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold leading-snug break-words ${
                      isSelected
                        ? "text-[var(--accent-foreground)]"
                        : "text-[var(--ink)]"
                    }`}
                  >
                    {option.label}
                  </p>
                  {isSelected ? (
                    <p className="mt-0.5 text-[11px] text-[var(--accent-foreground)]/80">
                      Selected
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
