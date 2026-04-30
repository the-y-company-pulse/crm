"use client"

import { useState } from "react"
import NewStageModal from "./NewStageModal"
import EditStageModal from "./EditStageModal"

type Stage = {
  id: string
  name: string
  order: number
  _count: {
    deals: number
  }
}

export default function StageManager({ stages: initialStages }: { stages: Stage[] }) {
  const [stages, setStages] = useState(initialStages)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)

  async function handleCreate(name: string) {
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      const newStage = await res.json()
      setStages([...stages, newStage])
      setShowNewModal(false)
    } else {
      alert("Kunde inte skapa fas")
    }
  }

  async function handleUpdate(id: string, name: string) {
    const res = await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      const updated = await res.json()
      setStages(stages.map((s) => (s.id === id ? updated : s)))
      setEditingStage(null)
    } else {
      alert("Kunde inte uppdatera fas")
    }
  }

  async function handleDelete(id: string) {
    const stage = stages.find((s) => s.id === id)
    if (!stage) return

    if (stage._count.deals > 0) {
      alert(
        `Kan inte ta bort fas med ${stage._count.deals} deals. Flytta deals till en annan fas först.`
      )
      return
    }

    if (stages.length <= 1) {
      alert("Kan inte ta bort den sista fasen. Minst en fas krävs.")
      return
    }

    if (!confirm(`Är du säker på att du vill ta bort "${stage.name}"?`)) {
      return
    }

    const res = await fetch(`/api/stages/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      // Reload stages to get updated order
      const updatedRes = await fetch("/api/stages")
      const updatedStages = await updatedRes.json()
      setStages(updatedStages)
    } else {
      const data = await res.json()
      alert(data.error || "Kunde inte ta bort fas")
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const newStages = [...stages]
    ;[newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]]
    await reorderStages(newStages)
  }

  async function handleMoveDown(index: number) {
    if (index === stages.length - 1) return
    const newStages = [...stages]
    ;[newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]]
    await reorderStages(newStages)
  }

  async function reorderStages(newStages: Stage[]) {
    const stageIds = newStages.map((s) => s.id)
    const res = await fetch("/api/stages/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds }),
    })

    if (res.ok) {
      const updated = await res.json()
      setStages(updated)
    } else {
      alert("Kunde inte ändra ordning på faser")
      // Reload from server to reset state
      const reloadRes = await fetch("/api/stages")
      if (reloadRes.ok) {
        const reloaded = await reloadRes.json()
        setStages(reloaded)
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ny fas
        </button>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="glass rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === stages.length - 1}
                  className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div>
                <div className="text-white font-medium">{stage.name}</div>
                <div className="text-white/40 text-sm">
                  {stage._count.deals} {stage._count.deals === 1 ? "deal" : "deals"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setEditingStage(stage)} className="btn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Redigera
              </button>
              <button
                onClick={() => handleDelete(stage.id)}
                className="btn hover:bg-red-500/10 hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Ta bort
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewModal && (
        <NewStageModal onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
      )}

      {editingStage && (
        <EditStageModal
          stage={editingStage}
          onClose={() => setEditingStage(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
