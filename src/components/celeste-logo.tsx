export const CELESTE_LOGO_SRC = "/logo.svg";

const LOGO_SIZES = {
  xs: 28,
  sm: 32,
  md: 36,
  lg: 48,
} as const;

type CelesteLogoSize = keyof typeof LOGO_SIZES;

interface CelesteLogoProps {
  size?: CelesteLogoSize;
  className?: string;
  rounded?: "none" | "md" | "full";
}

const ROUNDED_CLASS = {
  none: "",
  md: "rounded-lg",
  full: "rounded-full",
} as const;

export function CelesteLogo({
  size = "sm",
  className = "",
  rounded = "none",
}: CelesteLogoProps) {
  const px = LOGO_SIZES[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt="Celeste AI"
      width={px}
      height={px}
      className={`object-contain ${ROUNDED_CLASS[rounded]} ${className}`}
    />
  );
}

interface CelesteLogoAvatarProps {
  size?: CelesteLogoSize;
  className?: string;
  shape?: "circle" | "squircle";
}

const SHAPE_CLASS = {
  circle: "rounded-full",
  squircle: "rounded-xl sm:rounded-lg",
} as const;

/** Large centered brand mark for empty states and landing hero. */
export function CelesteLogoMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt="Celeste AI"
      width={192}
      height={192}
      className={`mx-auto size-36 object-contain drop-shadow-[0_0_24px_rgb(108_180_238/0.55)] sm:size-44 md:size-48 ${className}`}
    />
  );
}

/** Celeste AI assistant avatar — brand logo on black. */
export function CelesteLogoAvatar({
  size = "sm",
  className = "",
  shape = "squircle",
}: CelesteLogoAvatarProps) {
  const px = LOGO_SIZES[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-black ${SHAPE_CLASS[shape]} ${className}`}
      style={{ width: px, height: px }}
      role="img"
      aria-label="Celeste AI"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg */}
      <img
        src={CELESTE_LOGO_SRC}
        alt=""
        className="absolute inset-[10%] size-[80%] object-contain"
      />
    </div>
  );
}
