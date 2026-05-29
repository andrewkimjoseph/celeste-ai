import Image from "next/image";

export const CELESTE_LOGO_PATH = "/celeste-logo.png";

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
    <Image
      src={CELESTE_LOGO_PATH}
      alt="Celeste"
      width={px}
      height={px}
      className={`object-contain ${ROUNDED_CLASS[rounded]} ${className}`}
      priority
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

/** Celeste assistant avatar — always the brand logo on black. */
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
      aria-label="Celeste"
    >
      <Image
        src={CELESTE_LOGO_PATH}
        alt=""
        fill
        sizes={`${px}px`}
        className="object-contain p-[10%]"
        priority={size === "md"}
      />
    </div>
  );
}
