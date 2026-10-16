// Kulturradarn value lists — client-safe (no Prisma import)
export const RADAR_SIGNAL_TYPES = [
  "Ny strategi / nya mål",
  "Tidigare kontakt på ny post",
  "Kulturskav i media",
  "Sammanslagning",
  "Förvärvar bolag",
  "Kraftig tillväxt",
  "Ny VD i ägarlett bolag",
  "Generationsskifte",
  "Första HR-chef",
  "Ny HR-/People-chef",
  "Ny ägare / PE",
  "Nytt varumärke / namnbyte",
] as const

// A person we already know (past participant or customer contact) in a new role — the warmest way in
export const WARM_SIGNAL_TYPES: readonly string[] = ["Tidigare kontakt på ny post"]

export const RADAR_STATUSES = ["Ny", "Bevaka", "Kontaktad", "Ej relevant"] as const
export const RADAR_STRENGTHS = ["Hög", "Medel", "Låg"] as const
export const RADAR_REGIONS = ["Västra Götaland", "Halland", "Jönköpings län", "Övriga Sverige", "Okänd"] as const

// The area we prospect in (Bohuslän is part of Västra Götaland). "Okänd" is
// included so unclassified companies get looked at rather than silently hidden.
export const RADAR_TARGET_REGIONS: readonly string[] = ["Västra Götaland", "Halland", "Jönköpings län", "Okänd"]

export type RadarStatus = (typeof RADAR_STATUSES)[number]

export const STRENGTH_RANK: Record<string, number> = { "Hög": 3, "Medel": 2, "Låg": 1 }

// Ledarskapsradarn: companies that fit the open leadership program profile.
// "Passar profilen" is the base fit record (one per company); the others are
// triggers that make the timing better.
export const LEADERSHIP_SIGNAL_TYPES = [
  "Passar profilen",
  "Rekryterar chefer",
  "Ny chefsnivå / omorganisation",
  "Ny VD / ledningsgrupp",
  "Kraftig tillväxt",
] as const

export const RADARS = {
  kultur: { label: "Kulturradarn", types: RADAR_SIGNAL_TYPES as readonly string[] },
  ledarskap: { label: "Ledarskapsradarn", types: LEADERSHIP_SIGNAL_TYPES as readonly string[] },
} as const

export type RadarKey = keyof typeof RADARS

export function isRadarKey(v: unknown): v is RadarKey {
  return v === "kultur" || v === "ledarskap"
}
