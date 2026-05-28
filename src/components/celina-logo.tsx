import Image from "next/image";

export const CELINA_LOGO_PATH = "/celina-logo.png";

const LOGO_SIZES = {
  xs: 28,
  sm: 32,
  md: 36,
  lg: 48,
} as const;

type CelinaLogoSize = keyof typeof LOGO_SIZES;

interface CelinaLogoProps {
  size?: CelinaLogoSize;
  className?: string;
  rounded?: "none" | "md" | "full";
}

const ROUNDED_CLASS = {
  none: "",
  md: "rounded-lg",
  full: "rounded-full",
} as const;

export function CelinaLogo({
  size = "sm",
  className = "",
  rounded = "none",
}: CelinaLogoProps) {
  const px = LOGO_SIZES[size];

  return (
    <Image
      src={CELINA_LOGO_PATH}
      alt="Celina"
      width={px}
      height={px}
      className={`object-contain ${ROUNDED_CLASS[rounded]} ${className}`}
    />
  );
}

interface CelinaLogoAvatarProps {
  size?: CelinaLogoSize;
  className?: string;
  shape?: "circle" | "squircle";
}

const SHAPE_CLASS = {
  circle: "rounded-full",
  squircle: "rounded-xl sm:rounded-lg",
} as const;

export function CelinaLogoAvatar({
  size = "sm",
  className = "",
  shape = "circle",
}: CelinaLogoAvatarProps) {
  const px = LOGO_SIZES[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-black ${SHAPE_CLASS[shape]} ${className}`}
      style={{ width: px, height: px }}
      aria-hidden={shape === "squircle"}
      aria-label={shape === "circle" ? "Celina" : undefined}
    >
      <Image
        src={CELINA_LOGO_PATH}
        alt=""
        fill
        sizes={`${px}px`}
        className="object-cover"
      />
    </div>
  );
}
