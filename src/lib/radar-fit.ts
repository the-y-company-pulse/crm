// How well a company fits the leadership offerings. Each criterion is "ok",
// "no" or "unknown" so missing data is visible rather than silently counted as
// a miss. Client-safe.
//
// Öppet program has three segments:
//   A  – 60–300 employees without internal programs: must be profitable, have
//        cash, and be within the radius
//   B  – larger companies (NCC, Lindex) sending individual leaders: only the
//        distance to their office in the region matters
//   Offentlig – public sector (e.g. räddningstjänst): single seats fit within
//        direct procurement; only the distance matters
// Skräddarsytt program: ~30+ leaders within the target area.
import { companyDistanceKm } from "./geo"
import type { RadarKey } from "./radar-constants"

export const FIT_RULES = {
  minMarginPct: 5, // average over the two latest years
  minQuickRatioPct: 100,
  minEquityRatioPct: 30,
  minManagers: 7,
  maxManagers: 30,
  employeesPerManager: 9, // estimate when the number of managers isn't published
  minEmployees: 60, // employee range used when the manager count is unknown
  maxEmployees: 300,
  defaultRadiusKm: 100,
  tailoredMinManagers: 30,
  tailoredMinEmployees: 250,
}

const TAILORED_REGIONS = ["Västra Götaland", "Halland", "Jönköpings län"]

export type FitState = "ok" | "no" | "unknown"
export type FitCriterion = { key: string; label: string; state: FitState; detail: string }

export type FitCompany = {
  orgNr?: string | null
  city: string | null
  region?: string | null
  distanceKm: number | null
  employees: number | null
  managers: number | null
  revenueMsek: number | null
  operatingProfitMsek: number | null
  operatingProfitPrevMsek: number | null
  operatingMarginPct: number | null
  equityRatioPct: number | null
  quickRatioPct: number | null
  fiscalYear: number | null
}

const fmt = (n: number, d = 0) => n.toLocaleString("sv-SE", { maximumFractionDigits: d })

export function marginPct(c: FitCompany) {
  if (c.operatingMarginPct != null) return c.operatingMarginPct
  if (c.operatingProfitMsek != null && c.revenueMsek) return (c.operatingProfitMsek / c.revenueMsek) * 100
  return null
}

// Average operating margin over the two latest years. Previous year's revenue
// isn't stored, so its margin is approximated against the latest revenue.
export function averageMarginPct(c: FitCompany) {
  const latest = marginPct(c)
  if (latest == null) return null
  if (c.operatingProfitPrevMsek == null || !c.revenueMsek) return latest
  return (latest + (c.operatingProfitPrevMsek / c.revenueMsek) * 100) / 2
}

export function estimatedManagers(c: FitCompany): { value: number; estimated: boolean } | null {
  if (c.managers != null) return { value: c.managers, estimated: false }
  if (c.employees != null) return { value: Math.round(c.employees / FIT_RULES.employeesPerManager), estimated: true }
  return null
}

export type OpenSegment = "A" | "B" | "offentlig"

// Public-sector organisation numbers start with 2 (kommuner, regioner, myndigheter, kommunalförbund)
export function isPublicSector(c: FitCompany) {
  return !!c.orgNr && /^2\d{5}-?\d{4}$/.test(c.orgNr.trim())
}

export function openSegment(c: FitCompany): OpenSegment {
  if (isPublicSector(c)) return "offentlig"
  const r = FIT_RULES
  const large = c.managers != null ? c.managers > r.maxManagers : c.employees != null && c.employees > r.maxEmployees
  return large ? "B" : "A"
}

function nearCriterion(c: FitCompany, radiusKm: number, office = false): FitCriterion {
  // Towns missing from the coordinate table are only "unknown" if they could be
  // in western Sweden; a company classed as "Övriga Sverige" is far away.
  const d = companyDistanceKm(c)
  const farRegion = d == null && c.region === "Övriga Sverige"
  const state: FitState = d == null ? (farRegion ? "no" : "unknown") : d <= radiusKm ? "ok" : "no"
  const detail = d != null
    ? `${fmt(d)} km från Göteborg${office ? " (kontoret i regionen)" : ""}`
    : farRegion
      ? `Utanför västra Sverige${c.city ? ` (${c.city})` : ""}`
      : `Avstånd okänt${c.city ? ` (${c.city})` : ""}`
  return { key: "near", label: radiusKm >= 1000 ? "Avstånd" : `Inom ${fmt(radiusKm / 10, 1)} mil`, state, detail }
}

// Criteria for a radar; null for radars without a fit profile (Värdegrund)
export function evaluateRadarFit(c: FitCompany, radar: RadarKey, radiusKm = FIT_RULES.defaultRadiusKm): FitCriterion[] | null {
  if (radar === "ledarskap") return evaluateFit(c, radiusKm)
  if (radar === "skraddarsytt") return evaluateTailoredFit(c)
  return null
}

export function evaluateTailoredFit(c: FitCompany): FitCriterion[] {
  const r = FIT_RULES
  const m = estimatedManagers(c)
  const size: FitState = !m
    ? "unknown"
    : !m.estimated
      ? m.value >= r.tailoredMinManagers ? "ok" : "no"
      : c.employees! >= r.tailoredMinEmployees ? "ok" : "no"
  const sizeDetail = !m
    ? "Antal chefer och anställda saknas"
    : m.estimated ? `ca ${m.value} chefer (uppskattat från ${c.employees} anställda)` : `${m.value} chefer`

  const d = companyDistanceKm(c)
  const area: FitState = c.region && TAILORED_REGIONS.includes(c.region)
    ? "ok"
    : c.region === "Övriga Sverige"
      ? "no"
      : d != null ? (d <= 150 ? "ok" : "no") : "unknown"
  const areaDetail = [c.region ?? "Region okänd", d != null ? `${fmt(d)} km från Göteborg` : null].filter(Boolean).join(", ")

  return [
    { key: "leaders", label: `${r.tailoredMinManagers}+ ledare`, state: size, detail: sizeDetail },
    { key: "area", label: "I målområdet", state: area, detail: areaDetail },
  ]
}

export function evaluateFit(c: FitCompany, radiusKm = FIT_RULES.defaultRadiusKm): FitCriterion[] {
  const r = FIT_RULES
  const segment = openSegment(c)
  if (segment === "B") {
    return [
      { key: "segment", label: "Större bolag", state: "ok", detail: "Skickar enskilda ledare – storlek och ekonomi är inget krav" },
      nearCriterion(c, radiusKm, true),
    ]
  }
  if (segment === "offentlig") {
    return [
      { key: "segment", label: "Offentlig sektor", state: "ok", detail: "Enstaka platser ryms i direktupphandling" },
      nearCriterion(c, radiusKm, true),
    ]
  }
  const margin = marginPct(c)
  const avgMargin = averageMarginPct(c)
  const year = c.fiscalYear ? ` (${c.fiscalYear})` : ""

  // Lönsam: positive operating result both years and a healthy average margin,
  // so one weak year doesn't rule out an otherwise sound company
  let profitable: FitState = "unknown"
  if (
    (c.operatingProfitMsek != null && c.operatingProfitMsek <= 0) ||
    (c.operatingProfitPrevMsek != null && c.operatingProfitPrevMsek <= 0) ||
    (avgMargin != null && avgMargin < r.minMarginPct)
  ) profitable = "no"
  else if (c.operatingProfitMsek != null && c.operatingProfitPrevMsek != null && avgMargin != null) profitable = "ok"
  const profitDetail = margin == null
    ? "Resultat saknas"
    : c.operatingProfitPrevMsek == null
      ? `Rörelsemarginal ${fmt(margin, 1)} %${year}, föregående år saknas`
      : `Rörelsemarginal ${fmt(margin, 1)} %${year}, snitt två år ca ${fmt(avgMargin!, 1)} %`

  // Kassaflöde (proxy): quick ratio and equity ratio
  let cash: FitState = "unknown"
  if (
    (c.quickRatioPct != null && c.quickRatioPct < r.minQuickRatioPct) ||
    (c.equityRatioPct != null && c.equityRatioPct < r.minEquityRatioPct)
  ) cash = "no"
  else if (c.quickRatioPct != null && c.equityRatioPct != null) cash = "ok"
  const cashDetail = [
    c.quickRatioPct != null ? `Kassalikviditet ${fmt(c.quickRatioPct)} %` : "Kassalikviditet saknas",
    c.equityRatioPct != null ? `soliditet ${fmt(c.equityRatioPct)} %` : "soliditet saknas",
  ].join(", ")

  // 7–30 leaders
  const m = estimatedManagers(c)
  // Published manager count is judged directly; otherwise the employee range
  // that corresponds to 7–30 leaders (so the estimate's rounding doesn't decide)
  const leaders: FitState = !m
    ? "unknown"
    : !m.estimated
      ? m.value >= r.minManagers && m.value <= r.maxManagers ? "ok" : "no"
      : c.employees! >= r.minEmployees && c.employees! <= r.maxEmployees ? "ok" : "no"
  const leaderDetail = !m
    ? "Antal chefer och anställda saknas"
    : m.estimated
      ? `ca ${m.value} chefer (uppskattat från ${c.employees} anställda)`
      : `${m.value} chefer`

  return [
    { key: "profit", label: "Lönsamt", state: profitable, detail: profitDetail },
    { key: "cash", label: "Kassaflöde", state: cash, detail: cashDetail },
    { key: "leaders", label: `${r.minManagers}–${r.maxManagers} ledare`, state: leaders, detail: leaderDetail },
    nearCriterion(c, radiusKm),
  ]
}

// Share of the maximum (0–1) so profiles with different numbers of criteria
// compare fairly: 2 per met criterion, 1 per unknown, 0 per miss
export function fitScore(criteria: FitCriterion[]) {
  if (!criteria.length) return 0
  return criteria.reduce((s, c) => s + (c.state === "ok" ? 2 : c.state === "unknown" ? 1 : 0), 0) / (criteria.length * 2)
}
