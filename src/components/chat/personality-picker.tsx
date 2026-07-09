"use client";

import {
  CELESTIAL_PERSONALITIES,
  type CelestialPersonalityId,
} from "@/lib/celestial-personalities";

interface PersonalityPickerProps {
  selectedId: CelestialPersonalityId | null;
  onSelect: (id: CelestialPersonalityId) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

export function PersonalityPicker({
  selectedId,
  onSelect,
  title = "Choose your celestial personality",
  description = "Pick the constellation that represents you in chat.",
  compact = false,
}: PersonalityPickerProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div>
        <h3 className={compact ? "text-xs font-medium text-[var(--text-secondary)]" : "text-sm font-semibold text-[var(--text-primary)]"}>
          {title}
        </h3>
        <p className={compact ? "mt-0.5 text-[11px] text-[var(--text-subtle)]" : "mt-1 text-xs text-[var(--text-muted)]"}>
          {description}
        </p>
      </div>
      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
        {CELESTIAL_PERSONALITIES.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-xl border px-2.5 py-2 text-left transition-colors ${
                isSelected
                  ? "border-[var(--accent)]/70 bg-[var(--accent-soft)]"
                  : "border-[var(--surface-2)] bg-[var(--surface-1)] hover:border-[var(--accent)]/40"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- static personality assets in public */}
                <img
                  src={option.imageSrc}
                  alt={option.label}
                  width={compact ? 30 : 36}
                  height={compact ? 30 : 36}
                  className="size-7 shrink-0 rounded-full object-contain sm:size-8"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {option.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-subtle)]">
                    {isSelected ? "Selected" : "Select"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
