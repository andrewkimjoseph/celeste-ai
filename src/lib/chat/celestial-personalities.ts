export const CELESTIAL_PERSONALITY_IDS = [
  "aries_constellation",
  "beautiful_swirl",
  "comet_trail",
  "cosmic_cloud",
  "cosmic_flower",
  "enchanting_galaxy",
  "gold_galaxy",
  "lenticular_galaxy",
  "pink_planet",
  "scorpio_constellation",
] as const;

export type CelestialPersonalityId = (typeof CELESTIAL_PERSONALITY_IDS)[number];

export interface CelestialPersonalityOption {
  id: CelestialPersonalityId;
  label: string;
  imageSrc: string;
}

export const CELESTIAL_PERSONALITIES: readonly CelestialPersonalityOption[] = [
  {
    id: "aries_constellation",
    label: "Aries Constellation",
    imageSrc: "/celestial_personalities/aries_constellation.svg",
  },
  {
    id: "beautiful_swirl",
    label: "Beautiful Swirl",
    imageSrc: "/celestial_personalities/beautiful_swirl.svg",
  },
  {
    id: "comet_trail",
    label: "Comet Trail",
    imageSrc: "/celestial_personalities/comet_trail.svg",
  },
  {
    id: "cosmic_cloud",
    label: "Cosmic Cloud",
    imageSrc: "/celestial_personalities/cosmic_cloud.svg",
  },
  {
    id: "cosmic_flower",
    label: "Cosmic Flower",
    imageSrc: "/celestial_personalities/cosmic_flower.svg",
  },
  {
    id: "enchanting_galaxy",
    label: "Enchanting Galaxy",
    imageSrc: "/celestial_personalities/enchanting_galaxy.svg",
  },
  {
    id: "gold_galaxy",
    label: "Gold Galaxy",
    imageSrc: "/celestial_personalities/gold_galaxy.svg",
  },
  {
    id: "lenticular_galaxy",
    label: "Lenticular Galaxy",
    imageSrc: "/celestial_personalities/lenticular_galaxy.svg",
  },
  {
    id: "pink_planet",
    label: "Pink Planet",
    imageSrc: "/celestial_personalities/pink_planet.svg",
  },
  {
    id: "scorpio_constellation",
    label: "Scorpio Constellation",
    imageSrc: "/celestial_personalities/scorpio_constellation.svg",
  },
];

export function isCelestialPersonalityId(
  value: unknown,
): value is CelestialPersonalityId {
  return (
    typeof value === "string" &&
    CELESTIAL_PERSONALITY_IDS.includes(value as CelestialPersonalityId)
  );
}

export function getCelestialPersonality(
  id: CelestialPersonalityId | null | undefined,
): CelestialPersonalityOption | null {
  if (!id) {
    return null;
  }
  return CELESTIAL_PERSONALITIES.find((option) => option.id === id) ?? null;
}
