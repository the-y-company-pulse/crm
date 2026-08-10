"use client"

import { useState } from "react"
import type { ProjectType } from "@/lib/types"
import { PROJECT_TYPE_LABELS } from "@/lib/types"

type ActivityRow = { title: string; date: string }

type Props = {
  onClose: () => void
  onCreate: (data: {
    type: ProjectType
    name: string
    startDate: string
    endDate: string | null
    format: string | null
    location: string | null
    maxParticipants: number
    pricePerParticipant: number
    status: "planned" | "open" | "full" | "completed"
    notes: string | null
    milestones?: { title: string; date: string; status: "planned" | "done" }[]
  }) => void | Promise<void>
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const [type, setType] = useState<ProjectType>("ledarskapsprogram")
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [format, setFormat] = useState("")
  const [location, setLocation] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("16")
  const [pricePerParticipant, setPricePerParticipant] = useState("")
  const [status, setStatus] = useState<"planned" | "open" | "full" | "completed">("planned")
  const [notes, setNotes] = useState("")
  const [activities, setActivities] = useState<ActivityRow[]>([{ title: "", date: "" }])
  const [submitting, setSubmitting] = useState(false)

  const isCourse = type === "ledarskapsprogram"

  function updateActivity(i: number, patch: Partial<ActivityRow>) {
    setActivities((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  }
  function addActivity() {
    setActivities((prev) => [...prev, { title: "", date: startDate || "" }])
  }
  function removeActivity(i: number) {
    setActivities((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    if (!name.trim() || !startDate || submitting) return
    setSubmitting(true)
    try {
      const milestones = isCourse
        ? undefined
        : activities
            .filter((a) => a.title.trim() && a.date)
            .map((a) => ({
              title: a.title.trim(),
              date: new Date(a.date).toISOString(),
              status: "planned" as const,
            }))

      await onCreate({
        type,
        name: name.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        format: isCourse ? format.trim() || null : null,
        location: isCourse ? location.trim() || null : null,
        maxParticipants: isCourse ? parseInt(maxParticipants, 10) || 0 : 0,
        pricePerParticipant: isCourse ? parseInt(pricePerParticipant.replace(/\D/g, ""), 10) || 0 : 0,
        status,
        notes: notes.trim() || null,
        milestones: milestones && milestones.length > 0 ? milestones : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/90 md:bg-ink-950/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display text-lg md:text-xl text-white">Nytt projekt</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          {/* Project type selector */}
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Typ av projekt</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2.5 text-sm rounded-lg border transition-colors ${
                    type === t
                      ? "bg-neon/10 border-neon/60 text-white"
                      : "bg-navy/40 border-white/[0.12] text-white/60 hover:text-white hover:border-white/25"
                  }`}
                >
                  {PROJECT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Namn">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isCourse ? "t.ex. The Y Leadership Program Aug 2026" : "t.ex. Asurgents värdegrundsarbete"
                }
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Startdatum">
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="Slutdatum (valfritt)">
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Status">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="planned" className="bg-ink-900">Planerad</option>
                <option value="open" className="bg-ink-900">Öppen</option>
                {isCourse && <option value="full" className="bg-ink-900">Full</option>}
                <option value="completed" className="bg-ink-900">Genomförd</option>
              </select>
            </Field>

            {/* Course-only fields */}
            {isCourse && (
              <>
                <Field label="Format">
                  <input
                    className="input"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    placeholder="t.ex. 8 halvdagar under 8 veckor"
                  />
                </Field>

                <Field label="Plats">
                  <input
                    className="input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="t.ex. Bellora Business"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Max antal deltagare">
                    <input
                      type="number"
                      className="input"
                      inputMode="numeric"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      min="1"
                    />
                  </Field>
                  <Field label="Pris per deltagare (SEK)">
                    <input
                      className="input"
                      inputMode="numeric"
                      value={pricePerParticipant}
                      onChange={(e) => setPricePerParticipant(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Engagement activities */}
            {!isCourse && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-white/40">
                    Aktiviteter / delleveranser
                  </label>
                  <button
                    type="button"
                    onClick={addActivity}
                    className="text-neon/80 hover:text-neon text-xs font-medium"
                  >
                    + Lägg till aktivitet
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {activities.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="input flex-1"
                        value={a.title}
                        onChange={(e) => updateActivity(i, { title: e.target.value })}
                        placeholder="t.ex. Introduktion, Workshop, Analysmöte"
                      />
                      <input
                        type="date"
                        className="input w-40 shrink-0"
                        value={a.date}
                        min={startDate || undefined}
                        onChange={(e) => updateActivity(i, { date: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeActivity(i)}
                        className="text-white/30 hover:text-red-400 shrink-0 px-1"
                        aria-label="Ta bort aktivitet"
                        title="Ta bort aktivitet"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-white/30 text-xs mt-1.5">
                  Du kan lägga till, redigera och klarmarkera fler aktiviteter senare på projektsidan.
                </p>
              </div>
            )}

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[70px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Övriga detaljer..."
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={!name.trim() || !startDate || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Skapa
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
