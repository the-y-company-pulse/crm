"use client"

import type { Milestone } from "@/lib/types"

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]

const startOfDay = (t: number) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// A compact horizontal timeline for a single project: the project bar, the "idag"
// marker, and each delleverans as a dot. Read-only overview — completion happens in
// the list below it.
export default function ProjectMilestoneStrip({
  startDate,
  endDate,
  milestones,
  className = "",
}: {
  startDate: string
  endDate: string | null
  milestones: Milestone[]
  className?: string
}) {
  const today = startOfDay(Date.now())

  // Domain: project start/end plus every milestone date and today, padded a touch.
  const times = [new Date(startDate).getTime(), today]
  if (endDate) times.push(new Date(endDate).getTime())
  for (const m of milestones) times.push(new Date(m.date).getTime())
  let min = Math.min(...times)
  let max = Math.max(...times)
  if (max - min < 1000 * 60 * 60 * 24 * 14) {
    // Pad a two-week minimum window so dots aren't stacked.
    const pad = 1000 * 60 * 60 * 24 * 7
    min -= pad
    max += pad
  } else {
    const pad = (max - min) * 0.06
    min -= pad
    max += pad
  }

  const span = max - min || 1
  const pct = (t: number) => ((t - min) / span) * 100

  // Bar spans the whole project: from its start to the explicit end date, or to the
  // last delleverans when no end date is set.
  const startDateT = new Date(startDate).getTime()
  const milestoneMax = milestones.length
    ? Math.max(...milestones.map((m) => new Date(m.date).getTime()))
    : null
  const barEndT = endDate
    ? new Date(endDate).getTime()
    : milestoneMax != null && milestoneMax > startDateT
    ? milestoneMax
    : null
  const startL = pct(startDateT)
  const endL = barEndT != null ? pct(barEndT) : null
  const todayL = pct(today)
  const todayVisible = today >= min && today <= max

  return (
    <div className={className}>
      <div className="relative h-14">
        {/* Baseline / project bar */}
        {endL != null ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-neon/15 border border-neon/30"
            style={{ left: `${startL}%`, width: `${Math.max(endL - startL, 0.5)}%` }}
          />
        ) : (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px bg-white/10" />
        )}

        {/* Today marker */}
        {todayVisible && (
          <div
            className="absolute top-0 bottom-4 w-px bg-neon/60"
            style={{ left: `${todayL}%` }}
            title="Idag"
          >
            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neon" />
          </div>
        )}

        {/* Milestone dots + labels */}
        {milestones.map((m, i) => {
          const mt = startOfDay(new Date(m.date).getTime())
          const left = pct(new Date(m.date).getTime())
          const overdue = m.status !== "done" && mt < today
          const color = m.status === "done" ? "#deff00" : overdue ? "#ef4444" : "transparent"
          const border = m.status === "done" ? "#deff00" : overdue ? "#ef4444" : "rgba(255,255,255,0.55)"
          // Alternate labels above/below to reduce collisions.
          const above = i % 2 === 0
          return (
            <div key={m.id} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <span
                className="block w-3.5 h-3.5 rounded-full -translate-x-1/2"
                style={{
                  background: color,
                  border: `2px solid ${border}`,
                  boxShadow: m.status === "done" ? "0 0 8px rgba(222,255,0,0.6)" : "none",
                }}
                title={`${m.title} · ${new Date(m.date).getDate()} ${MONTHS[new Date(m.date).getMonth()]}`}
              />
              <span
                className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] max-w-[90px] truncate ${
                  m.status === "done" ? "text-white/50" : overdue ? "text-red-400" : "text-white/60"
                } ${above ? "bottom-5" : "top-5"}`}
              >
                {m.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
