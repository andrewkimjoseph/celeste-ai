export const CELESTE_LOGO_SRC = "/logo.svg";
export const CELESTE_GLOBE_SRC = "/globe.svg";

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
}

export function CelesteLogo({
  size = "sm",
  className = "",
}: CelesteLogoProps) {
  const px = LOGO_SIZES[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt="Celeste AI"
      width={px}
      height={px}
      className={`object-contain ${className}`}
    />
  );
}

interface CelesteLogoAvatarProps {
  size?: CelesteLogoSize;
  className?: string;
}

export function CelesteGlobeMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt=""
      width={96}
      height={96}
      className={`mx-auto size-20 object-contain sm:size-24 ${className}`}
      aria-hidden
    />
  );
}

/** Large centered brand mark for empty states and landing hero. */
export function CelesteLogoMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt="Celeste AI"
      width={192}
      height={192}
      className={`mx-auto size-36 object-contain sm:size-44 md:size-48 ${className}`}
    />
  );
}

/** Celeste AI assistant avatar. */
export function CelesteLogoAvatar({
  size = "sm",
  className = "",
}: CelesteLogoAvatarProps) {
  const px = LOGO_SIZES[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand mark; public/logo.svg
    <img
      src={CELESTE_LOGO_SRC}
      alt="Celeste AI"
      width={px}
      height={px}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
