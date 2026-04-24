"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ProjectDetail as ProjectDetailType } from "@/lib/types"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PARTICIPANT_STATUS_LABELS } from "@/lib/types"
import EditProjectModal from "./EditProjectModal"
import AddParticipantModal from "./AddParticipantModal"

export default function ProjectDetail({ project: initialProject }: { project: ProjectDetailType }) {
  const [project, setProject] = useState(initialProject)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const router = useRouter()

  const confirmedParticipants = project.participants.filter((p) => p.status === "confirmed")
  const availableSpots = project.maxParticipants - confirmedParticipants.length
  const totalValue = confirmedParticipants.length * project.pricePerParticipant
  const pipelineValue = project.deals
    .filter((d) => d.status === "open")
    .reduce((sum, d) => sum + d.value, 0)

  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK"

  async function handleUpdate(data: any) {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const updated = await res.json()
      setProject(updated)
      setShowEditModal(false)
      router.refresh()
    }
  }

  async function handleAddParticipant(data: any) {
    const res = await fetch(`/api/projects/${project.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const participant = await res.json()
      setProject({
        ...project,
        participants: [...project.participants, participant],
      })
      setShowAddParticipant(false)
      router.refresh()
    }
  }

  async function handleRemoveParticipant(participantId: string) {
    if (!confirm("Är du säker på att du vill ta bort denna deltagare?")) return

    const res = await fetch(`/api/projects/${project.id}/participants/${participantId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setProject({
        ...project,
        participants: project.participants.filter((p) => p.id !== participantId),
      })
      router.refresh()
    }
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <Link
          href="/projekt"
          className="text-white/40 hover:text-white text-sm mb-4 inline-flex items-center gap-2"
        >
          ← Tillbaka till projekt
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="font-display text-3xl text-white mb-2">{project.name}</h1>
            <div className="text-white/40 text-sm space-y-1">
              <div>
                {new Date(project.startDate).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div>{project.participants.length} deltagare · {project.deals.length} deals</div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span
              className="px-3 py-1.5 text-sm rounded"
              style={{
                background: PROJECT_STATUS_COLORS[project.status] + "20",
                color: PROJECT_STATUS_COLORS[project.status],
              }}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            <button onClick={() => setShowEditModal(true)} className="btn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Redigera
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Bekräftade deltagare</div>
          <div className="text-2xl font-bold text-white">
            {confirmedParticipants.length}/{project.maxParticipants}
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Lediga platser</div>
          <div className="text-2xl font-bold text-neon">
            {availableSpots} st
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Totalt värde</div>
          <div className="text-2xl font-bold text-white">
            {fmt(totalValue)}
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Pipeline-värde</div>
          <div className="text-2xl font-bold text-white">
            {fmt(pipelineValue)}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-white/40 text-sm mb-1">Format</div>
            <div className="text-white">{project.format || "—"}</div>
          </div>
          <div>
            <div className="text-white/40 text-sm mb-1">Pris per deltagare</div>
            <div className="text-white">{fmt(project.pricePerParticipant)}</div>
          </div>
        </div>
        {project.notes && (
          <div className="mt-4">
            <div className="text-white/40 text-sm mb-1">Anteckningar</div>
            <div className="text-white whitespace-pre-wrap">{project.notes}</div>
          </div>
        )}
      </div>

      {/* Participants Section */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Deltagare ({project.participants.length})
          </h3>
          <button onClick={() => setShowAddParticipant(true)} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Lägg till deltagare
          </button>
        </div>

        {project.participants.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            Inga deltagare ännu
          </div>
        ) : (
          <div className="space-y-3">
            {project.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/kontakter/${participant.contactId}`}
                      className="text-white font-medium hover:text-neon transition-colors"
                    >
                      {participant.contact?.fullName}
                    </Link>
                    <span
                      className="px-2 py-0.5 text-xs rounded"
                      style={{
                        background: participant.status === "confirmed" ? "#1D9E7520" : "#88878020",
                        color: participant.status === "confirmed" ? "#1D9E75" : "#888780",
                      }}
                    >
                      {PARTICIPANT_STATUS_LABELS[participant.status]}
                    </span>
                  </div>
                  <div className="text-white/40 text-sm mt-1">
                    {participant.contact?.company?.name && (
                      <Link
                        href={`/foretag/${participant.contact.company.id}`}
                        className="hover:text-white/60"
                      >
                        {participant.contact.company.name}
                      </Link>
                    )}
                    {participant.contact?.email && (
                      <>
                        {participant.contact.company && " · "}
                        {participant.contact.email}
                      </>
                    )}
                  </div>
                  {participant.notes && (
                    <div className="text-white/50 text-sm mt-2 italic">{participant.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveParticipant(participant.id)}
                  className="text-white/40 hover:text-red-400 transition-colors ml-4"
                  title="Ta bort deltagare"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deals Section */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Kopplade deals ({project.deals.length})
        </h3>

        {project.deals.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            Inga deals kopplade ännu
          </div>
        ) : (
          <div className="space-y-3">
            {project.deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/pipeline?deal=${deal.id}`}
                className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">{deal.title}</div>
                  <div className="text-white/40 text-sm mt-1">
                    {deal.stage.name} · {fmt(deal.value)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 text-xs rounded"
                    style={{
                      background: deal.status === "won" ? "#1D9E7520" : deal.status === "lost" ? "#88878020" : "#378ADD20",
                      color: deal.status === "won" ? "#1D9E75" : deal.status === "lost" ? "#888780" : "#378ADD",
                    }}
                  >
                    {deal.status === "won" ? "Vunnen" : deal.status === "lost" ? "Förlorad" : "Öppen"}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: deal.owner.color }}
                  >
                    {deal.owner.initial}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}

      {showAddParticipant && (
        <AddParticipantModal
          projectId={project.id}
          onClose={() => setShowAddParticipant(false)}
          onAdd={handleAddParticipant}
        />
      )}
    </div>
  )
}
