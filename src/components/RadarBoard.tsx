"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { ownerBg, ownerText } from "@/lib/ownerColor"
import {
  RADAR_REGIONS,
  RADAR_STATUSES,
  RADAR_STRENGTHS,
  RADAR_TARGET_REGIONS,
  RADARS,
  STRENGTH_RANK,
  type RadarKey,
  type RadarStatus,
} from "@/lib/radar-constants"
import { FIT_RULES, evaluateFit, fitScore, type FitCriterion, type FitState } from "@/lib/radar-fit"
import type { User } from "@/lib/types"
import NewSignalModal from "./NewSignalModal"

type RadarContact = {
  id: string
  fullName: string
  title: string | null
  email: string | null
  phone: string | null
  sourceUrl: string | null
  notes: string | null
  _count?: { participants: number }
}

export type RadarSignal = {
  id: string
  type: string
  summary: string
  eventDate: string | null
  sourceName: string | null
  sourceUrl: string | null
  strength: string | null
  angle: string | null
  status: RadarStatus
  statusChangedAt: string | null
  statusBy: { name: string } | null
  createdAt: string
  company: {
    id: string
    name: string
    orgNr: string | null
    industry: string | null
    city: string | null
    region: string | null
    employees: number | null
    employeesNote: string | null
    switchboard: string | null
    email: string | null
    emailPattern: string | null
    notes: string | null
    ownerId: string | null
    owner: User | null
    gapAmbition: number | null
    gapDrive: number | null
    fiscalYear: number | null
    revenueMsek: number | null
    operatingProfitMsek: number | null
    operatingProfitPrevMsek: number | null
    operatingMarginPct: number | null
    equityRatioPct: number | null
    quickRatioPct: number | null
    managers: number | null
    distanceKm: number | null
    contacts: RadarContact[]
    deals: { id: string; status: string }[]
  }
}

type Props = {
  radar: RadarKey
  signals: RadarSignal[]
  users: User[]
  failed: { id: string; bolag: string; processError: string | null }[]
  currentUserId: string
}

type SortKey = "added" | "event" | "strength" | "company" | "fit"

const STATUS_STYLE: Record<RadarStatus, string> = {
  "Ny": "bg-neon/15 text-neon border-neon/40",
  "Bevaka": "bg-white/[0.06] text-white/80 border-white/20",
  "Kontaktad": "bg-[rgb(var(--c-won)/0.15)] text-[rgb(var(--c-won))] border-[rgb(var(--c-won)/0.4)]",
  "Ej relevant": "bg-transparent text-white/35 border-white/10",
}

const STRENGTH_STYLE: Record<string, string> = {
  "Hög": "text-neon",
  "Medel": "text-white/70",
  "Låg": "text-white/35",
}

// The radar's recommended person: the contact it supplied (has a source URL), else the newest
function radarContact(s: RadarSignal) {
  return s.company.contacts.find((c) => c.sourceUrl) ?? s.company.contacts[0] ?? null
}

function openDeal(s: RadarSignal) {
  return s.company.deals.find((d) => d.status === "open") ?? null
}

function isGapTopProspect(s: RadarSignal) {
  return s.company.gapAmbition === 3 && s.company.gapDrive === 1
}

function pastParticipants(s: RadarSignal) {
  return s.company.contacts.reduce((n, c) => n + (c._count?.participants ?? 0), 0)
}

const FIT_STYLE: Record<FitState, string> = {
  ok: "bg-[rgb(var(--c-won)/0.14)] text-[rgb(var(--c-won))] border-[rgb(var(--c-won)/0.35)]",
  no: "bg-[rgb(var(--c-lost)/0.10)] text-[rgb(var(--c-lost))] border-[rgb(var(--c-lost)/0.30)]",
  unknown: "bg-transparent text-white/40 border-white/15 border-dashed",
}
const FIT_MARK: Record<FitState, string> = { ok: "✓", no: "✕", unknown: "?" }

export default function RadarBoard({ radar, signals: initial, users, failed, currentUserId }: Props) {
  const isLeadership = radar === "ledarskap"
  const isMobile = useIsMobile()
  const router = useRouter()
  const [signals, setSignals] = useState(initial)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [region, setRegion] = useState("target")
  const [strength, setStrength] = useState("")
  const [status, setStatus] = useState("active")
  const [owner, setOwner] = useState("")
  const [sort, setSort] = useState<SortKey>(isLeadership ? "fit" : "added")
  const [radiusKm, setRadiusKm] = useState(FIT_RULES.defaultRadiusKm) // 0 = any distance
  const [fitFilter, setFitFilter] = useState<"" | "full" | "nomiss">("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Pick up fresh server data after router.refresh()
  useEffect(() => setSignals(initial), [initial])

  const fitById = useMemo(() => {
    const m = new Map<string, FitCriterion[]>()
    if (isLeadership) for (const s of signals) m.set(s.id, evaluateFit(s.company, radiusKm || 1000))
    return m
  }, [signals, radiusKm, isLeadership])

  // In scope: target regions (kultur) or not known to be outside the radius (ledarskap)
  const inScope = (s: RadarSignal) =>
    isLeadership
      ? !radiusKm || fitById.get(s.id)?.find((c) => c.key === "near")?.state !== "no"
      : RADAR_TARGET_REGIONS.includes(s.company.region ?? "Okänd")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = signals.filter((s) => {
      if (type && s.type !== type) return false
      if (isLeadership) {
        if (!inScope(s)) return false
        const fit = fitById.get(s.id) ?? []
        if (fitFilter === "full" && !fit.every((c) => c.state === "ok")) return false
        if (fitFilter === "nomiss" && fit.some((c) => c.state === "no")) return false
      } else {
        const r = s.company.region ?? "Okänd"
        if (region === "target" && !RADAR_TARGET_REGIONS.includes(r)) return false
        if (region && region !== "target" && r !== region) return false
      }
      if (strength && s.strength !== strength) return false
      if (status === "active" && s.status === "Ej relevant") return false
      if (status && status !== "active" && s.status !== status) return false
      if (owner === "none" && s.company.ownerId) return false
      if (owner && owner !== "none" && s.company.ownerId !== owner) return false
      if (q) {
        const hay = [
          s.company.name,
          s.company.city,
          s.company.industry,
          s.summary,
          s.angle,
          radarContact(s)?.fullName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const byStrength = (a: RadarSignal, b: RadarSignal) =>
      (STRENGTH_RANK[b.strength ?? ""] ?? 0) - (STRENGTH_RANK[a.strength ?? ""] ?? 0)
    const byAdded = (a: RadarSignal, b: RadarSignal) =>
      b.createdAt.slice(0, 10).localeCompare(a.createdAt.slice(0, 10)) || byStrength(a, b)
    return list.sort((a, b) => {
      switch (sort) {
        case "event":
          return (b.eventDate ?? "").localeCompare(a.eventDate ?? "") || byAdded(a, b)
        case "strength":
          return byStrength(a, b) || b.createdAt.localeCompare(a.createdAt)
        case "company":
          return a.company.name.localeCompare(b.company.name, "sv")
        case "fit":
          return fitScore(fitById.get(b.id) ?? []) - fitScore(fitById.get(a.id) ?? []) || byAdded(a, b)
        default:
          return byAdded(a, b)
      }
    })
  }, [signals, search, type, region, strength, status, owner, sort, fitById, fitFilter, radiusKm])

  const inTarget = signals.filter(inScope)
  const outsideCount = signals.length - inTarget.length
  const newCount = inTarget.filter((s) => s.status === "Ny").length
  const companyCount = new Set(inTarget.map((s) => s.company.id)).size

  async function updateStatus(s: RadarSignal, next: RadarStatus) {
    const prev = s.status
    setSignals((list) => list.map((x) => (x.id === s.id ? { ...x, status: next } : x)))
    const res = await fetch(`/api/signals/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      setSignals((list) => list.map((x) => (x.id === s.id ? { ...x, status: prev } : x)))
    }
  }

  async function updateOwner(s: RadarSignal, ownerId: string) {
    const res = await fetch(`/api/companies/${s.company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: ownerId || null }),
    })
    if (!res.ok) return
    const ownerUser = users.find((u) => u.id === ownerId) ?? null
    setSignals((list) =>
      list.map((x) =>
        x.company.id === s.company.id
          ? { ...x, company: { ...x.company, ownerId: ownerId || null, owner: ownerUser } }
          : x
      )
    )
  }

  async function createDeal(s: RadarSignal) {
    setBusy(s.id)
    try {
      const res = await fetch(`/api/signals/${s.id}/deal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: s.company.ownerId ?? currentUserId }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 409) return
      const dealId = data.id ?? data.dealId
      const ownerId = s.company.ownerId ?? currentUserId
      const ownerUser = users.find((u) => u.id === ownerId) ?? null
      setSignals((list) =>
        list.map((x) =>
          x.company.id === s.company.id
            ? {
                ...x,
                company: {
                  ...x.company,
                  ownerId,
                  owner: ownerUser,
                  deals: [{ id: dealId, status: "open" }, ...x.company.deals],
                },
              }
            : x
        )
      )
    } finally {
      setBusy(null)
    }
  }

  async function reprocess() {
    setProcessing(true)
    try {
      await fetch("/api/radar/process", { method: "POST" })
      router.refresh()
    } finally {
      setProcessing(false)
    }
  }

  const filters = (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="relative w-full md:w-72">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök bolag, ort, signal, kontakt..."
          className="input w-full py-2.5 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            aria-label="Rensa sökning"
          >
            ×
          </button>
        )}
      </div>
      <FilterSelect value={type} onChange={setType} label="Alla signaltyper" options={RADARS[radar].types} />
      {isLeadership ? (
        <>
          <select className="input w-auto py-2.5 text-sm" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
            <option value={50}>Inom 5 mil</option>
            <option value={75}>Inom 7,5 mil</option>
            <option value={100}>Inom 10 mil</option>
            <option value={0}>Alla avstånd</option>
          </select>
          <select className="input w-auto py-2.5 text-sm" value={fitFilter} onChange={(e) => setFitFilter(e.target.value as typeof fitFilter)}>
            <option value="">All matchning</option>
            <option value="nomiss">Inga kända missar</option>
            <option value="full">Full matchning</option>
          </select>
        </>
      ) : (
        <>
          <select className="input w-auto py-2.5 text-sm" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="target">Målområdet (VG, Halland, Jönköping)</option>
            <option value="">Alla regioner</option>
            {RADAR_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <FilterSelect value={strength} onChange={setStrength} label="Alla styrkor" options={RADAR_STRENGTHS} />
        </>
      )}
      <select className="input w-auto py-2.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="active">Aktiva (ej "Ej relevant")</option>
        <option value="">Alla statusar</option>
        {RADAR_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select className="input w-auto py-2.5 text-sm" value={owner} onChange={(e) => setOwner(e.target.value)}>
        <option value="">Alla ansvariga</option>
        <option value="none">Ingen ansvarig</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <select className="input w-auto py-2.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
        {isLeadership && <option value="fit">Bäst matchning</option>}
        <option value="added">Senast tillagd</option>
        <option value="event">Händelsedatum</option>
        <option value="strength">Styrka</option>
        <option value="company">Bolag A–Ö</option>
      </select>
    </div>
  )

  const header = (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
      <div>
        <div className="flex gap-1 mb-3 p-1 bg-white/[0.03] border border-white/[0.08] rounded-lg w-fit">
          {(Object.keys(RADARS) as RadarKey[]).map((k) => (
            <Link
              key={k}
              href={`/radar?radar=${k}`}
              className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
                k === radar ? "bg-white/[0.10] text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {RADARS[k].label}
            </Link>
          ))}
        </div>
        <h1 className="font-display text-2xl md:text-3xl text-white mb-2">{RADARS[radar].label}</h1>
        <div className="text-white/40 text-xs md:text-sm">
          {inTarget.length} signaler {isLeadership ? (radiusKm ? `inom ${radiusKm / 10} mil` : "") : "i målområdet"} · {companyCount} bolag · <span className="text-neon">{newCount} nya</span>
          {outsideCount > 0 && <> · {outsideCount} utanför</>}
          {filtered.length !== inTarget.length && <> · visar {filtered.length}</>}
        </div>
      </div>
      <div className="flex gap-2 self-start md:self-auto">
        <button onClick={reprocess} disabled={processing} className="btn btn-secondary text-sm py-2">
          {processing ? "Läser inkorg..." : "Läs in nya signaler"}
        </button>
        <button onClick={() => setShowNew(true)} className="btn btn-primary text-sm py-2">
          + Lägg till signal
        </button>
      </div>
    </div>
  )

  const modal = showNew && (
    <NewSignalModal
      radar={radar}
      onClose={() => setShowNew(false)}
      onCreated={(result) => {
        setShowNew(false)
        setNotice(
          `${result.processed} signal${result.processed === 1 ? "" : "er"} tillagd${result.processed === 1 ? "" : "a"}` +
            (result.failed.length ? ` · ${result.failed.length} kunde inte läsas in` : "")
        )
        router.refresh()
      }}
    />
  )

  const noticeBar = notice && (
    <div className="mb-6 rounded-lg border border-neon/40 bg-neon/10 px-4 py-3 text-sm text-white/85 flex items-center justify-between">
      <span>{notice}</span>
      <button onClick={() => setNotice(null)} className="text-white/50 hover:text-white" aria-label="Stäng">×</button>
    </div>
  )

  const failedNotice = failed.length > 0 && (
    <div className="mb-6 rounded-lg border border-[rgb(var(--c-lost)/0.4)] bg-[rgb(var(--c-lost)/0.08)] p-4 text-sm">
      <div className="font-semibold text-[rgb(var(--c-lost))] mb-1">
        {failed.length} rad{failed.length === 1 ? "" : "er"} i inkorgen kunde inte läsas in
      </div>
      <ul className="text-white/70 space-y-0.5">
        {failed.map((f) => (
          <li key={f.id}>
            {f.bolag}: <span className="text-white/50">{f.processError}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  const empty = (
    <p className="text-white/40 text-center py-16 text-sm">
      {signals.length === 0 ? "Inga signaler ännu." : "Inga signaler matchar filtret."}
    </p>
  )

  if (isMobile) {
    return (
      <div className="px-4 py-4">
        {header}
        {noticeBar}
        {failedNotice}
        {filters}
        {modal}
        {filtered.length === 0 ? empty : (
          <div className="flex flex-col gap-3">
            {filtered.map((s) => (
              <div key={s.id} className="glass rounded-lg p-4">
                <button className="w-full text-left" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <div className="text-base font-medium text-white truncate">{s.company.name}</div>
                      <div className="text-xs text-white/40 truncate">
                        {[s.company.city, s.company.industry].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {!isLeadership && <StrengthLabel strength={s.strength} />}
                  </div>
                  {isLeadership && <FitChips fit={fitById.get(s.id) ?? []} className="mb-2" />}
                  <div className="text-xs text-white/50 mb-2">{s.type}{s.eventDate && ` · ${s.eventDate}`}</div>
                  <p className={`text-sm text-white/80 ${expanded === s.id ? "" : "line-clamp-2"}`}>{s.summary}</p>
                </button>
                {expanded === s.id && <SignalDetails s={s} fit={fitById.get(s.id)} />}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusSelect value={s.status} onChange={(v) => updateStatus(s, v)} />
                  <OwnerSelect s={s} users={users} onChange={(v) => updateOwner(s, v)} />
                  <DealAction s={s} busy={busy === s.id} onCreate={() => createDeal(s)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      {header}
      {noticeBar}
      {failedNotice}
      {filters}
      {modal}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.05] border-b border-white/[0.08]">
            <tr>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">Bolag</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">Signal</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">{isLeadership ? "Profil" : "Styrka"}</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">Ansvarig</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">Status</th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-white/70">Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}>{empty}</td></tr>
            ) : (
              filtered.map((s) => (
                <RadarRow
                  key={s.id}
                  s={s}
                  fit={isLeadership ? fitById.get(s.id) ?? [] : null}
                  users={users}
                  expanded={expanded === s.id}
                  busy={busy === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  onStatus={(v) => updateStatus(s, v)}
                  onOwner={(v) => updateOwner(s, v)}
                  onCreateDeal={() => createDeal(s)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RadarRow({
  s, fit, users, expanded, busy, onToggle, onStatus, onOwner, onCreateDeal,
}: {
  s: RadarSignal
  fit: FitCriterion[] | null
  users: User[]
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onStatus: (v: RadarStatus) => void
  onOwner: (v: string) => void
  onCreateDeal: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer align-top ${
          s.status === "Ej relevant" ? "opacity-50" : ""
        }`}
      >
        <td className="px-5 py-4 w-[22%]">
          <Link
            href={`/foretag/${s.company.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-white font-medium hover:text-neon transition-colors"
          >
            {s.company.name}
          </Link>
          {isGapTopProspect(s) && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-neon border border-neon/40 rounded px-1.5 py-0.5" title="Hög ambition, låg drivkraft i värderingarna">
              Glapp
            </span>
          )}
          {pastParticipants(s) > 0 && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-[rgb(var(--c-won))] border border-[rgb(var(--c-won)/0.4)] rounded px-1.5 py-0.5" title="Har skickat deltagare till tidigare program">
              Tidigare deltagare
            </span>
          )}
          <div className="text-xs text-white/40 mt-0.5">
            {[s.company.city, s.company.industry].filter(Boolean).join(" · ")}
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="text-xs text-white/50 mb-1">
            {s.type}{s.eventDate && ` · ${s.eventDate}`}
          </div>
          <p className={`text-sm text-white/85 ${expanded ? "" : "line-clamp-2"}`}>{s.summary}</p>
        </td>
        <td className="px-5 py-4">
          {fit ? <FitChips fit={fit} /> : <StrengthLabel strength={s.strength} />}
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <OwnerSelect s={s} users={users} onChange={onOwner} />
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <StatusSelect value={s.status} onChange={onStatus} />
        </td>
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <DealAction s={s} busy={busy} onCreate={onCreateDeal} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.05] bg-white/[0.015]">
          <td colSpan={6} className="px-5 pb-5">
            <SignalDetails s={s} fit={fit ?? undefined} />
          </td>
        </tr>
      )}
    </>
  )
}

function SignalDetails({ s, fit }: { s: RadarSignal; fit?: FitCriterion[] }) {
  const c = radarContact(s)
  const c2 = s.company
  const participants = pastParticipants(s)
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-8 pt-3 text-sm">
      <div className="space-y-2">
        {fit?.map((f) => (
          <Detail key={f.key} label={`${FIT_MARK[f.state]} ${f.label}`} value={f.detail} />
        ))}
        {fit && c2.revenueMsek != null && (
          <Detail label="Omsättning" value={`${c2.revenueMsek.toLocaleString("sv-SE")} MSEK${c2.fiscalYear ? ` (${c2.fiscalYear})` : ""}`} />
        )}
        {participants > 0 && <Detail label="Tidigare" value={`${participants} deltagare i tidigare program`} />}
        {s.angle && <Detail label="Vinkel" value={s.angle} />}
        <Detail
          label="Källa"
          value={s.sourceName ?? s.sourceUrl ?? "—"}
          href={s.sourceUrl ?? undefined}
        />
        <Detail label="Anställda" value={c2.employees?.toString() ?? c2.employeesNote ?? "okänt"} />
        <Detail label="Region" value={c2.region ?? "Okänd"} />
        {(c2.gapAmbition || c2.gapDrive) && (
          <Detail label="Glapp" value={`Ambition ${c2.gapAmbition ?? "–"} · Drivkraft ${c2.gapDrive ?? "–"}`} />
        )}
        {s.statusBy && s.statusChangedAt && (
          <Detail
            label="Status satt"
            value={`${s.statusBy.name}, ${new Date(s.statusChangedAt).toLocaleDateString("sv-SE")}`}
          />
        )}
        <Detail label="Tillagd" value={new Date(s.createdAt).toLocaleDateString("sv-SE")} />
      </div>
      <div className="space-y-2">
        {c ? (
          <>
            <Detail label="Kontakt" value={[c.fullName, c.title].filter(Boolean).join(", ")} href={`/kontakter/${c.id}`} internal />
            {c.phone && <Detail label="Telefon" value={c.phone} href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} />}
            {c.email && <Detail label="E-post" value={c.email} href={`mailto:${c.email}`} />}
            {c.sourceUrl && <Detail label="Kontaktkälla" value={hostOf(c.sourceUrl)} href={c.sourceUrl} />}
            {c.notes && <Detail label="Kommentar" value={c.notes} />}
          </>
        ) : (
          <Detail label="Kontakt" value="Ingen kontaktperson hittad ännu" />
        )}
        {c2.switchboard && <Detail label="Växel" value={c2.switchboard} href={`tel:${c2.switchboard.replace(/[^\d+]/g, "")}`} />}
        {c2.email && <Detail label="Allmän e-post" value={c2.email} href={`mailto:${c2.email}`} />}
        {c2.emailPattern && <Detail label="E-postmönster" value={`${c2.emailPattern} (mönster, inte en adress)`} />}
      </div>
    </div>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function Detail({ label, value, href, internal }: { label: string; value: string; href?: string; internal?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-white/40 w-28 flex-shrink-0">{label}</span>
      {href ? (
        internal ? (
          <Link href={href} className="text-neon hover:underline break-words min-w-0">{value}</Link>
        ) : (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-neon hover:underline break-words min-w-0">
            {value}
          </a>
        )
      ) : (
        <span className="text-white/85 whitespace-pre-wrap break-words min-w-0">{value}</span>
      )}
    </div>
  )
}

function FitChips({ fit, className = "" }: { fit: FitCriterion[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {fit.map((f) => (
        <span
          key={f.key}
          title={f.detail}
          className={`text-[11px] font-medium rounded border px-1.5 py-0.5 whitespace-nowrap ${FIT_STYLE[f.state]}`}
        >
          {FIT_MARK[f.state]} {f.label}
        </span>
      ))}
    </div>
  )
}

function StrengthLabel({ strength }: { strength: string | null }) {
  if (!strength) return <span className="text-white/20 text-sm">—</span>
  return <span className={`text-sm font-semibold ${STRENGTH_STYLE[strength] ?? "text-white/60"}`}>{strength}</span>
}

function FilterSelect({
  value, onChange, label, options,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  options: readonly string[]
}) {
  return (
    <select className="input w-auto py-2.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function StatusSelect({ value, onChange }: { value: RadarStatus; onChange: (v: RadarStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RadarStatus)}
      className={`text-xs font-semibold rounded-md border px-2.5 py-1.5 cursor-pointer focus:outline-none ${STATUS_STYLE[value]}`}
      aria-label="Status"
    >
      {RADAR_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-ink-900 text-white">{s}</option>
      ))}
    </select>
  )
}

function OwnerSelect({ s, users, onChange }: { s: RadarSignal; users: User[]; onChange: (v: string) => void }) {
  const o = s.company.owner
  return (
    <div className="flex items-center gap-2">
      <span
        className="owner-dot w-6 h-6 flex-shrink-0"
        style={o ? { background: ownerBg(o.color), color: ownerText(ownerBg(o.color)) } : { border: "1px dashed rgb(var(--c-white) / 0.25)" }}
        title={o?.name ?? "Ingen ansvarig"}
      >
        {o?.initial ?? ""}
      </span>
      <select
        value={s.company.ownerId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-white/70 focus:outline-none cursor-pointer"
        aria-label="Ansvarig"
      >
        <option value="" className="bg-ink-900">Ingen</option>
        {users.map((u) => (
          <option key={u.id} value={u.id} className="bg-ink-900">{u.name}</option>
        ))}
      </select>
    </div>
  )
}

function DealAction({ s, busy, onCreate }: { s: RadarSignal; busy: boolean; onCreate: () => void }) {
  if (s.company.deals.some((d) => d.status === "won")) {
    return <span className="text-xs font-semibold text-[rgb(var(--c-won))]">Kund</span>
  }
  if (openDeal(s)) {
    return (
      <Link href={`/foretag/${s.company.id}`} className="text-xs text-neon hover:underline whitespace-nowrap">
        I pipeline →
      </Link>
    )
  }
  return (
    <button
      onClick={onCreate}
      disabled={busy}
      className="text-xs font-medium rounded-md border border-white/15 bg-navy/60 text-white/80 hover:border-neon/60 hover:text-white px-2.5 py-1.5 whitespace-nowrap disabled:opacity-40"
    >
      {busy ? "Skapar..." : "Skapa deal"}
    </button>
  )
}
