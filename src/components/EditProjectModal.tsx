"use client"

import { useState } from "react"
import type { Project, ProjectType } from "@/lib/types"
import { PROJECT_TYPE_LABELS } from "@/lib/types"

type Props = {
  project: Project
  onClose: () => void
  onUpdate: (data: Partial<Project>) => void | Promise<void>
}

export default function EditProjectModal({ project, onClose, onUpdate }: Props) {
  const [type, setType] = useState<ProjectType>(project.type)
  const [name, setName] = useState(project.name)
  const [startDate, setStartDate] = useState(project.startDate.split("T")[0])
  const [endDate, setEndDate] = useState(project.endDate ? project.endDate.split("T")[0] : "")
  const [format, setFormat] = useState(project.format || "")
  const [location, setLocation] = useState(project.location || "")
  const [maxParticipants, setMaxParticipants] = useState(project.maxParticipants.toString())
  const [pricePerParticipant, setPricePerParticipant] = useState(project.pricePerParticipant.toString())
  const [status, setStatus] = useState(project.status)
  const [notes, setNotes] = useState(project.notes || "")
  const [submitting, setSubmitting] = useState(false)

  const isCourse = type === "ledarskapsprogram"

  async function submit() {
    if (!name.trim() || !startDate || submitting) return
    setSubmitting(true)
    try {
      await onUpdate({
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
            <h2 className="font-display text-lg md:text-xl text-white">Redigera projekt</h2>
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
                    />
                  </Field>
                </div>
              </>
            )}

            <Field label="Anteckningar">
              <textarea
                className="input min-h-[80px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={!name.trim() || !startDate || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              Spara
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
