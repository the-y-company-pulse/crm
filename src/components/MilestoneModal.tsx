"use client"

import { useState } from "react"
import type { Milestone } from "@/lib/types"

export type MilestoneInput = {
  title: string
  date: string
  status: "planned" | "done"
  notes: string | null
}

type Props = {
  milestone?: Milestone | null
  defaultDate?: string // yyyy-mm-dd to prefill when adding
  onClose: () => void
  onSubmit: (data: MilestoneInput) => void | Promise<void>
}

export default function MilestoneModal({ milestone, defaultDate, onClose, onSubmit }: Props) {
  const isEdit = !!milestone
  const [title, setTitle] = useState(milestone?.title ?? "")
  const [date, setDate] = useState(
    milestone ? milestone.date.split("T")[0] : defaultDate ?? ""
  )
  const [done, setDone] = useState(milestone?.status === "done")
  const [notes, setNotes] = useState(milestone?.notes ?? "")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim() || !date || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        date: new Date(date).toISOString(),
        status: done ? "done" : "planned",
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
            <h2 className="font-display text-lg md:text-xl text-white">
              {isEdit ? "Redigera delleverans" : "Ny delleverans"}
            </h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Titel">
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Workshop, Analysmöte, Introduktion"
                autoFocus
              />
            </Field>

            <Field label="Datum">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>

            <label className="flex items-center gap-3 py-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => setDone(e.target.checked)}
                className="w-5 h-5 accent-neon"
              />
              <span className="text-sm text-white/80">Klarmarkerad</span>
            </label>

            <Field label="Anteckningar (valfritt)">
              <textarea
                className="input min-h-[70px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detaljer om delleveransen..."
              />
            </Field>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex-1 md:flex-initial">
              Avbryt
            </button>
            <button
              onClick={submit}
              disabled={!title.trim() || !date || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex-1 md:flex-initial"
            >
              {isEdit ? "Spara" : "Lägg till"}
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
