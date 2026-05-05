"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import NewStageModal from "./NewStageModal"
import EditStageModal from "./EditStageModal"
import SortableStageItem from "./SortableStageItem"

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  async function refreshStages() {
    try {
      const res = await fetch("/api/stages")
      if (res.ok) {
        const data = await res.json()
        setStages(data)
      }
    } catch (error) {
      console.error("Failed to refresh stages:", error)
    }
  }

  async function handleCreate(name: string) {
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      await refreshStages()
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
      await refreshStages()
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
      await refreshStages()
    } else {
      const data = await res.json()
      alert(data.error || "Kunde inte ta bort fas")
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistic update
    const reorderedStages = arrayMove(stages, oldIndex, newIndex)
    setStages(reorderedStages)

    // Send to server
    const stageIds = reorderedStages.map((s) => s.id)
    const res = await fetch("/api/stages/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageIds }),
    })

    if (!res.ok) {
      alert("Kunde inte ändra ordning på faser")
      await refreshStages() // Revert on error
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stages.map((stage) => (
              <SortableStageItem
                key={stage.id}
                stage={stage}
                onEdit={() => setEditingStage(stage)}
                onDelete={() => handleDelete(stage.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
