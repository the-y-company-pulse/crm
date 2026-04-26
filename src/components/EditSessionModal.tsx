"use client"

import { useState } from "react"
import type { ProjectSession } from "@/lib/types"

type Props = {
  session: ProjectSession
  onClose: () => void
  onUpdate: (data: {
    date: string
    startTime: string
    endTime: string
    notes: string | null
  }) => void | Promise<void>
}

export default function EditSessionModal({ session, onClose, onUpdate }: Props) {
  const [date, setDate] = useState(session.date.split("T")[0]) // YYYY-MM-DD
  const [startTime, setStartTime] = useState(session.startTime)
  const [endTime, setEndTime] = useState(session.endTime)
  const [notes, setNotes] = useState(session.notes || "")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    try {
      await onUpdate({
        date: new Date(date).toISOString(),
        startTime,
        endTime,
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
            <h2 className="font-display text-lg md:text-xl text-white">Redigera session</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Datum">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starttid">
                <input
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Field>
              <Field label="Sluttid">
                <input
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[60px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="T.ex. plats eller särskild information..."
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={submitting}
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
