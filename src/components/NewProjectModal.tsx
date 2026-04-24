"use client"

import { useState } from "react"

type Props = {
  onClose: () => void
  onCreate: (data: {
    name: string
    startDate: string
    format: string | null
    maxParticipants: number
    pricePerParticipant: number
    status: "planned" | "open" | "full" | "completed"
    notes: string | null
  }) => void | Promise<void>
}

export default function NewProjectModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [format, setFormat] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("16")
  const [pricePerParticipant, setPricePerParticipant] = useState("")
  const [status, setStatus] = useState<"planned" | "open" | "full" | "completed">("planned")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim() || !startDate || submitting) return
    setSubmitting(true)
    try {
      await onCreate({
        name: name.trim(),
        startDate: new Date(startDate).toISOString(),
        format: format.trim() || null,
        maxParticipants: parseInt(maxParticipants, 10) || 16,
        pricePerParticipant: parseInt(pricePerParticipant.replace(/\D/g, ""), 10) || 0,
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
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-w-md p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display text-lg md:text-xl text-white">Nytt projekt</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Namn">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. The Y Leadership Program Aug 2026"
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
              <Field label="Status">
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="planned" className="bg-ink-900">Planerad</option>
                  <option value="open" className="bg-ink-900">Öppen</option>
                  <option value="full" className="bg-ink-900">Full</option>
                  <option value="completed" className="bg-ink-900">Genomförd</option>
                </select>
              </Field>
            </div>

            <Field label="Format">
              <input
                className="input"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="t.ex. 8 halvdagar under 8 veckor"
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

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[80px] resize-y"
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
