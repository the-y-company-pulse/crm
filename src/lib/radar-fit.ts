// Ledarskapsradarn: how well a company fits the open leadership program.
// Each criterion is "ok", "no" or "unknown" so missing data is visible rather
// than silently counted as a miss. Client-safe.
import { companyDistanceKm } from "./geo"

export const FIT_RULES = {
  minMarginPct: 5,
  minQuickRatioPct: 100,
  minEquityRatioPct: 30,
  minManagers: 10,
  maxManagers: 30,
  employeesPerManager: 9, // estimate when the number of managers isn't published
  minEmployees: 80, // employee range used when the manager count is unknown
  maxEmployees: 300,
  defaultRadiusKm: 100,
}

export type FitState = "ok" | "no" | "unknown"
export type FitCriterion = { key: string; label: string; state: FitState; detail: string }

export type FitCompany = {
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

export function estimatedManagers(c: FitCompany): { value: number; estimated: boolean } | null {
  if (c.managers != null) return { value: c.managers, estimated: false }
  if (c.employees != null) return { value: Math.round(c.employees / FIT_RULES.employeesPerManager), estimated: true }
  return null
}

export function evaluateFit(c: FitCompany, radiusKm = FIT_RULES.defaultRadiusKm): FitCriterion[] {
  const r = FIT_RULES
  const margin = marginPct(c)
  const year = c.fiscalYear ? ` (${c.fiscalYear})` : ""

  // Lönsam: positive operating result both years and a healthy margin
  let profitable: FitState = "unknown"
  if (
    (c.operatingProfitMsek != null && c.operatingProfitMsek <= 0) ||
    (c.operatingProfitPrevMsek != null && c.operatingProfitPrevMsek <= 0) ||
    (margin != null && margin < r.minMarginPct)
  ) profitable = "no"
  else if (c.operatingProfitMsek != null && c.operatingProfitPrevMsek != null && margin != null) profitable = "ok"
  const profitDetail = margin != null
    ? `Rörelsemarginal ${fmt(margin, 1)} %${year}` + (c.operatingProfitPrevMsek == null ? ", föregående år saknas" : "")
    : "Resultat saknas"

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

  // 10–30 leaders
  const m = estimatedManagers(c)
  // Published manager count is judged directly; otherwise the employee range
  // that corresponds to 10–30 leaders (so the estimate's rounding doesn't decide)
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

  // Within the radius from Göteborg
  // Towns missing from the coordinate table are only "unknown" if they could be
  // in western Sweden; a company classed as "Övriga Sverige" is far away.
  const d = companyDistanceKm(c)
  const farRegion = d == null && c.region === "Övriga Sverige"
  const near: FitState = d == null ? (farRegion ? "no" : "unknown") : d <= radiusKm ? "ok" : "no"
  const nearDetail = d != null
    ? `${fmt(d)} km från Göteborg`
    : farRegion
      ? `Utanför västra Sverige${c.city ? ` (${c.city})` : ""}`
      : `Avstånd okänt${c.city ? ` (${c.city})` : ""}`

  return [
    { key: "profit", label: "Lönsamt", state: profitable, detail: profitDetail },
    { key: "cash", label: "Kassaflöde", state: cash, detail: cashDetail },
    { key: "leaders", label: "10–30 ledare", state: leaders, detail: leaderDetail },
    { key: "near", label: `Inom ${radiusKm / 10} mil`, state: near, detail: nearDetail },
  ]
}

// Higher is better: 2 per met criterion, 1 per unknown, 0 per miss
export function fitScore(criteria: FitCriterion[]) {
  return criteria.reduce((s, c) => s + (c.state === "ok" ? 2 : c.state === "unknown" ? 1 : 0), 0)
}
