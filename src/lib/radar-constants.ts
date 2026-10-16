// Kulturradarn value lists — client-safe (no Prisma import)
export const RADAR_SIGNAL_TYPES = [
  "Kulturskav i media",
  "Sammanslagning",
  "Kraftig tillväxt",
  "Ny VD i ägarlett bolag",
  "Generationsskifte",
  "Första HR-chef",
  "Ny ägare / PE",
] as const

export const RADAR_STATUSES = ["Ny", "Bevaka", "Kontaktad", "Ej relevant"] as const
export const RADAR_STRENGTHS = ["Hög", "Medel", "Låg"] as const
export const RADAR_REGIONS = ["Västra Götaland", "Halland", "Jönköpings län", "Övriga Sverige", "Okänd"] as const

// The area we prospect in (Bohuslän is part of Västra Götaland). "Okänd" is
// included so unclassified companies get looked at rather than silently hidden.
export const RADAR_TARGET_REGIONS: readonly string[] = ["Västra Götaland", "Halland", "Jönköpings län", "Okänd"]

export type RadarStatus = (typeof RADAR_STATUSES)[number]

export const STRENGTH_RANK: Record<string, number> = { "Hög": 3, "Medel": 2, "Låg": 1 }
