"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { ProjectWithStats, Milestone } from "@/lib/types"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_TYPE_LABELS } from "@/lib/types"

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
const LABEL_W = 240 // px — sticky project column
const ROW_H = 96 // px per project row
const MIN_MONTH_W = 120 // most zoomed-out
const MAX_MONTH_W = 460 // most zoomed-in
const DEFAULT_VISIBLE_MONTHS = 4 // default zoom fits ~4 months in view

// Distinct, dark-theme-friendly colours cycled per project row.
const PALETTE = ["#4f8ff7", "#f2864b", "#43c463", "#f5b642", "#ec6a9c", "#8b7ff0", "#2dd4bf", "#e0574f"]

const SEASONS = ["Vinter", "Vår", "Sommar", "Höst"] // index by Math.floor(((month+1)%12)/3)
const seasonOf = (month: number) => SEASONS[Math.floor(((month + 1) % 12) / 3)]

const startOfDay = (t: number) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const fmtDay = (t: number) => {
  const d = new Date(t)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function ProjectTimeline({
  projects: initialProjects,
}: {
  projects: ProjectWithStats[]
}) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [monthW, setMonthW] = useState(220)
  const didInit = useRef(false)

  const today = startOfDay(Date.now())

  const rows = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [projects]
  )

  // Domain = earliest to latest date across all projects, snapped to whole months.
  const domain = useMemo(() => {
    const times: number[] = [today]
    for (const p of rows) {
      times.push(new Date(p.startDate).getTime())
      if (p.endDate) times.push(new Date(p.endDate).getTime())
      for (const m of p.milestones ?? []) times.push(new Date(m.date).getTime())
      for (const s of p.sessions ?? []) times.push(new Date(s.date).getTime())
    }
    const min = new Date(Math.min(...times))
    const max = new Date(Math.max(...times))
    const start = new Date(min.getFullYear(), min.getMonth(), 1)
    let end = new Date(max.getFullYear(), max.getMonth() + 1, 1)
    if (end.getTime() - start.getTime() < 1000 * 60 * 60 * 24 * 60) {
      end = new Date(start.getFullYear(), start.getMonth() + 2, 1)
    }
    return { start: start.getTime(), end: end.getTime() }
  }, [rows, today])

  // One entry per month in the domain.
  const months = useMemo(() => {
    const out: { date: Date; showYear: boolean }[] = []
    const d = new Date(domain.start)
    let lastYear = -1
    while (d.getTime() < domain.end) {
      out.push({ date: new Date(d), showYear: d.getFullYear() !== lastYear })
      lastYear = d.getFullYear()
      d.setMonth(d.getMonth() + 1)
    }
    return out
  }, [domain])

  // Contiguous months grouped into seasons for the top band.
  const seasonBands = useMemo(() => {
    const bands: { label: string; startIdx: number; span: number }[] = []
    months.forEach((m, i) => {
      const label = seasonOf(m.date.getMonth())
      const last = bands[bands.length - 1]
      if (last && last.label === label && last.startIdx + last.span === i) last.span++
      else bands.push({ label, startIdx: i, span: 1 })
    })
    return bands
  }, [months])

  const trackW = months.length * monthW
  const todayLeft = pct(today, domain)

  // Initial zoom: fit ~4 months to the available width (once, on mount).
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || didInit.current) return
    didInit.current = true
    const avail = el.clientWidth - LABEL_W
    if (avail > 0) {
      const w = Math.round(avail / DEFAULT_VISIBLE_MONTHS)
      setMonthW(Math.max(MIN_MONTH_W, Math.min(MAX_MONTH_W, w)))
    }
  }, [])

  // Keep "idag" in view: recenter the scroll on today whenever the zoom changes.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const todayPx = (todayLeft / 100) * trackW
    el.scrollLeft = Math.max(0, todayPx - monthW * 0.5)
  }, [monthW, trackW, todayLeft])

  const zoomIn = () => setMonthW((w) => Math.min(MAX_MONTH_W, w + 60))
  const zoomOut = () => setMonthW((w) => Math.max(MIN_MONTH_W, w - 60))

  async function toggleMilestone(projectId: string, m: Milestone) {
    const nextStatus = m.status === "done" ? "planned" : "done"
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              milestones: (p.milestones ?? []).map((x) =>
                x.id === m.id
                  ? { ...x, status: nextStatus, completedAt: nextStatus === "done" ? new Date().toISOString() : null }
                  : x
              ),
            }
      )
    )
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error("Failed")
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: (p.milestones ?? []).map((x) =>
                  x.id === m.id ? { ...x, status: m.status, completedAt: m.completedAt } : x
                ),
              }
        )
      )
    }
  }

  if (rows.length === 0) {
    return <div className="text-center py-16 text-white/40">Inga projekt att visa på tidslinjen.</div>
  }

  return (
    <div>
      {/* Legend + zoom */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <Diamond kind="planned" /> Planerad
          </span>
          <span className="flex items-center gap-1.5">
            <Diamond kind="done" /> Klar
          </span>
          <span className="flex items-center gap-1.5">
            <Diamond kind="overdue" /> Försenad
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-0.5 h-3.5" style={{ background: "#ff6b6b" }} /> Idag
          </span>
          <span className="text-white/30 hidden lg:inline">· klicka på en punkt för att klarmarkera</span>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-white/30 mr-1 hidden md:inline">Zoom</span>
          <button
            onClick={zoomOut}
            disabled={monthW <= MIN_MONTH_W}
            className="w-8 h-8 rounded-md border border-white/[0.12] text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/[0.12] flex items-center justify-center"
            title="Zooma ut"
            aria-label="Zooma ut"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={zoomIn}
            disabled={monthW >= MAX_MONTH_W}
            className="w-8 h-8 rounded-md border border-white/[0.12] text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:hover:border-white/[0.12] flex items-center justify-center"
            title="Zooma in"
            aria-label="Zooma in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="glass rounded-xl overflow-x-auto">
        <div style={{ minWidth: LABEL_W + trackW }}>
          {/* Season band */}
          <div className="flex border-b border-white/[0.06]">
            <div className="sticky left-0 z-20 bg-navy/95 shrink-0" style={{ width: LABEL_W }} />
            <div className="relative h-7" style={{ width: trackW }}>
              {seasonBands.map((b, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] uppercase tracking-[0.15em] text-white/30 border-l border-white/[0.06]"
                  style={{ left: b.startIdx * monthW, width: b.span * monthW }}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Month axis + Idag marker */}
          <div className="flex border-b border-white/[0.08]">
            <div
              className="sticky left-0 z-20 bg-navy/95 shrink-0 border-r border-white/[0.08] flex items-end px-4 pb-2"
              style={{ width: LABEL_W }}
            >
              <span className="text-[11px] uppercase tracking-wider text-white/40">Projekt</span>
            </div>
            <div className="relative h-9" style={{ width: trackW }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-white/[0.06] flex items-center pl-2 text-[11px] text-white/45"
                  style={{ left: i * monthW, width: monthW }}
                >
                  {MONTHS[m.date.getMonth()]}
                  {m.showYear && <span className="ml-1 text-white/25">{m.date.getFullYear()}</span>}
                </div>
              ))}
              {/* Idag pill */}
              <div
                className="absolute top-1 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap z-[2]"
                style={{ left: `${todayLeft}%`, background: "#ff6b6b", color: "#1a0808" }}
              >
                Idag · {fmtDay(today)}
              </div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((p, rowIdx) => {
            const color = PALETTE[rowIdx % PALETTE.length]
            const startDateT = new Date(p.startDate).getTime()
            const ms = [...(p.milestones ?? [])].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            const activityDates = [
              ...ms.map((m) => new Date(m.date).getTime()),
              ...(p.sessions ?? []).map((s) => new Date(s.date).getTime()),
            ]
            const explicitEnd = p.endDate ? new Date(p.endDate).getTime() : null
            const barStartT = Math.min(startDateT, ...(activityDates.length ? activityDates : [startDateT]))
            const ends = [
              ...(explicitEnd != null ? [explicitEnd] : []),
              ...(activityDates.length ? [Math.max(...activityDates)] : []),
            ]
            let barEndT: number | null = ends.length ? Math.max(...ends) : null
            if (barEndT != null && barEndT <= barStartT) barEndT = null

            const startL = pct(barStartT, domain)
            const endL = barEndT != null ? pct(barEndT, domain) : null

            // Progress: milestone completion if any, else how far into the timespan today is.
            const doneCount = ms.filter((m) => m.status === "done").length
            let progress = 0
            if (ms.length > 0) progress = doneCount / ms.length
            else if (barEndT != null) progress = clamp((today - barStartT) / (barEndT - barStartT), 0, 1)
            const progressPct = Math.round(progress * 100)

            return (
              <div
                key={p.id}
                className="flex items-stretch border-b border-white/[0.05] last:border-b-0 group"
                style={{ height: ROW_H }}
              >
                {/* Sticky label */}
                <button
                  onClick={() => router.push(`/projekt/${p.id}`)}
                  className="sticky left-0 z-10 bg-navy/95 shrink-0 border-r border-white/[0.08] text-left px-4 hover:bg-navy transition-colors flex flex-col justify-center gap-1"
                  style={{ width: LABEL_W }}
                >
                  <div className="text-sm text-white font-medium truncate group-hover:text-neon transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-white/35 truncate">{PROJECT_TYPE_LABELS[p.type]}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 text-[10px] rounded inline-flex items-center gap-1"
                      style={{
                        background: PROJECT_STATUS_COLORS[p.status] + "20",
                        color: PROJECT_STATUS_COLORS[p.status],
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PROJECT_STATUS_COLORS[p.status] }} />
                      {PROJECT_STATUS_LABELS[p.status]}
                    </span>
                    {ms.length > 0 && (
                      <span className="text-[10px] text-white/40">
                        {doneCount}/{ms.length} klara
                      </span>
                    )}
                  </div>
                </button>

                {/* Track */}
                <div className="relative" style={{ width: trackW }}>
                  {/* Today line */}
                  <div
                    className="absolute top-0 bottom-0 w-px pointer-events-none z-[1]"
                    style={{ left: `${todayLeft}%`, background: "#ff6b6b80" }}
                  />

                  {endL != null ? (
                    <>
                      {/* Bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md overflow-hidden"
                        style={{
                          left: `${startL}%`,
                          width: `${Math.max(endL - startL, 0.6)}%`,
                          background: color + "33",
                          border: `1px solid ${color}66`,
                        }}
                        title={`${fmtDay(barStartT)} – ${fmtDay(barEndT!)} · ${progressPct}% klart`}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${progressPct}%`, background: color }}
                        />
                      </div>
                      {/* Progress % — trailing the bar so it never collides with a milestone */}
                      <span
                        className="absolute top-1/2 -translate-y-1/2 ml-2 text-[11px] font-semibold text-white/80 z-[2]"
                        style={{ left: `${endL}%` }}
                      >
                        {progressPct}%
                      </span>

                      {/* Milestone diamonds + labels */}
                      {ms.map((m, i) => {
                        const mt = startOfDay(new Date(m.date).getTime())
                        const left = pct(new Date(m.date).getTime(), domain)
                        const overdue = m.status !== "done" && mt < today
                        const kind = m.status === "done" ? "done" : overdue ? "overdue" : "planned"
                        const below = i % 2 === 1
                        return (
                          <div key={m.id} className="absolute" style={{ left: `${left}%`, top: 0, bottom: 0 }}>
                            <button
                              onClick={() => toggleMilestone(p.id, m)}
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform hover:scale-125 z-[2]"
                              title={`${m.title} · ${fmtDay(new Date(m.date).getTime())} · ${
                                m.status === "done" ? "Klar" : overdue ? "Försenad" : "Planerad"
                              }\n(klicka för att ${m.status === "done" ? "avmarkera" : "klarmarkera"})`}
                            >
                              <Diamond kind={kind} />
                            </button>
                            <span
                              className={`absolute -translate-x-1/2 whitespace-nowrap text-[10px] max-w-[110px] truncate ${
                                m.status === "done" ? "text-white/70" : overdue ? "text-red-400" : "text-white/55"
                              }`}
                              style={{
                                left: "50%",
                                top: below ? "calc(50% + 16px)" : undefined,
                                bottom: below ? undefined : "calc(50% + 16px)",
                              }}
                            >
                              {m.title}
                            </span>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-white/40 whitespace-nowrap"
                      style={{ left: `${startL}%` }}
                      title={`Start ${fmtDay(startDateT)} · inga inplanerade aktiviteter ännu`}
                    >
                      <span className="w-2.5 h-2.5 rotate-45" style={{ background: color }} />
                      Startar
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// A milestone marker: filled neon (done, with check), hollow (planned), red (overdue).
function Diamond({ kind }: { kind: "done" | "planned" | "overdue" }) {
  const fill = kind === "done" ? "#deff00" : kind === "overdue" ? "#ef4444" : "transparent"
  const border = kind === "done" ? "#deff00" : kind === "overdue" ? "#ef4444" : "rgba(255,255,255,0.6)"
  return (
    <span
      className="relative inline-flex items-center justify-center w-3.5 h-3.5 rotate-45 rounded-[2px]"
      style={{
        background: fill,
        border: `2px solid ${border}`,
        boxShadow: kind === "done" ? "0 0 8px rgba(222,255,0,0.55)" : "none",
      }}
    >
      {kind === "done" && (
        <svg className="w-2 h-2 -rotate-45 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  )
}

// Position (0–100%) of a timestamp within the domain.
function pct(t: number, domain: { start: number; end: number }): number {
  const span = domain.end - domain.start
  if (span <= 0) return 0
  return ((t - domain.start) / span) * 100
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
