"use client"

import { useState } from "react"

type Props = {
  projectId: string
  onClose: () => void
  onAdd: (data: {
    dates: string[]
    startTime: string
    endTime: string
    notes: string | null
  }) => void | Promise<void>
}

export default function AddSessionsModal({ projectId, onClose, onAdd }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("12:30")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Get all days in current month
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Fill in leading empty days
    const firstDayOfWeek = firstDay.getDay()
    const leadingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday = 0

    for (let i = 0; i < leadingDays; i++) {
      days.push(new Date(0)) // placeholder
    }

    // Fill in actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  function toggleDate(date: Date) {
    const dateStr = date.toISOString()
    const newSet = new Set(selectedDates)
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr)
    } else {
      newSet.add(dateStr)
    }
    setSelectedDates(newSet)
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  async function submit() {
    if (selectedDates.size === 0 || submitting) return
    setSubmitting(true)
    try {
      await onAdd({
        dates: Array.from(selectedDates),
        startTime,
        endTime,
        notes: notes.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/90 md:bg-ink-950/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-w-lg p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display text-lg md:text-xl text-white">Lägg till sessioner</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Calendar */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">
                Välj datum
              </label>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={previousMonth}
                    className="text-white/60 hover:text-white p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-white font-medium capitalize">{monthName}</div>
                  <button
                    onClick={nextMonth}
                    className="text-white/60 hover:text-white p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
                    <div key={day} className="text-center text-xs text-white/40 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    if (day.getTime() === 0) {
                      return <div key={idx} className="aspect-square" />
                    }

                    const dateStr = day.toISOString()
                    const isSelected = selectedDates.has(dateStr)
                    const isToday = day.toDateString() === new Date().toDateString()

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDate(day)}
                        className={`aspect-square rounded text-sm transition-colors ${
                          isSelected
                            ? "bg-neon text-ink-950 font-bold"
                            : isToday
                            ? "bg-white/10 text-white hover:bg-white/20"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })}
                </div>

                {selectedDates.size > 0 && (
                  <div className="mt-3 text-sm text-white/60">
                    {selectedDates.size} datum valda
                  </div>
                )}
              </div>
            </div>

            {/* Time inputs */}
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

            {/* Notes */}
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
              disabled={selectedDates.size === 0 || submitting}
              className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial"
            >
              Lägg till {selectedDates.size > 0 && `(${selectedDates.size})`}
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
