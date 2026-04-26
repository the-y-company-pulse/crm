"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ProjectDetail as ProjectDetailType } from "@/lib/types"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PARTICIPANT_STATUS_LABELS } from "@/lib/types"
import EditProjectModal from "./EditProjectModal"
import AddParticipantModal from "./AddParticipantModal"
import EditParticipantModal from "./EditParticipantModal"
import AddSessionsModal from "./AddSessionsModal"
import EditSessionModal from "./EditSessionModal"
import type { Participant, ProjectSession } from "@/lib/types"

export default function ProjectDetail({ project: initialProject }: { project: ProjectDetailType }) {
  const [project, setProject] = useState(initialProject)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [showAddSessions, setShowAddSessions] = useState(false)
  const [editingSession, setEditingSession] = useState<ProjectSession | null>(null)
  const router = useRouter()

  const confirmedParticipants = project.participants.filter((p) => p.status === "confirmed")
  const availableSpots = project.maxParticipants - confirmedParticipants.length
  const totalValue = confirmedParticipants.reduce((sum, p) => sum + p.invoicedAmount, 0)
  const totalPaid = confirmedParticipants.filter((p) => p.isPaid).reduce((sum, p) => sum + p.invoicedAmount, 0)
  const totalUnpaid = totalValue - totalPaid
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

  async function handleUpdateParticipant(participantId: string, data: any) {
    const res = await fetch(`/api/projects/${project.id}/participants/${participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const updated = await res.json()
      setProject({
        ...project,
        participants: project.participants.map((p) => (p.id === participantId ? updated : p)),
      })
      setEditingParticipant(null)
      router.refresh()
    }
  }

  async function handleAddSessions(data: any) {
    const res = await fetch(`/api/projects/${project.id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const sessions = await res.json()
      setProject({
        ...project,
        sessions,
      })
      setShowAddSessions(false)
      router.refresh()
    }
  }

  async function handleUpdateSession(sessionId: string, data: any) {
    const res = await fetch(`/api/projects/${project.id}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const updated = await res.json()
      setProject({
        ...project,
        sessions: project.sessions.map((s) => (s.id === sessionId ? updated : s)),
      })
      setEditingSession(null)
      router.refresh()
    }
  }

  async function handleRemoveSession(sessionId: string) {
    if (!confirm("Är du säker på att du vill ta bort denna session?")) return

    const res = await fetch(`/api/projects/${project.id}/sessions/${sessionId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setProject({
        ...project,
        sessions: project.sessions.filter((s) => s.id !== sessionId),
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
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
          <div className="text-white/40 text-sm mb-2">Fakturerat</div>
          <div className="text-2xl font-bold text-white">
            {fmt(totalValue)}
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Betalt</div>
          <div className="text-2xl font-bold text-green-400">
            {fmt(totalPaid)}
          </div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="text-white/40 text-sm mb-2">Obetalt</div>
          <div className="text-2xl font-bold text-yellow-400">
            {fmt(totalUnpaid)}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Information</h3>
          <button onClick={() => setShowAddSessions(true)} className="btn">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Lägg till sessioner
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
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
          <div className="mb-6">
            <div className="text-white/40 text-sm mb-1">Anteckningar</div>
            <div className="text-white whitespace-pre-wrap">{project.notes}</div>
          </div>
        )}

        {/* Sessions */}
        {project.sessions.length > 0 && (
          <div>
            <div className="text-white/40 text-sm mb-3">Sessioner ({project.sessions.length})</div>
            <div className="space-y-2">
              {project.sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {new Date(session.date).toLocaleDateString("sv-SE", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-white/60 text-sm">
                      {session.startTime} - {session.endTime}
                      {session.notes && ` · ${session.notes}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingSession(session)}
                      className="text-white/40 hover:text-neon transition-colors"
                      title="Redigera session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveSession(session.id)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                      title="Ta bort session"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="flex items-center gap-3 flex-wrap">
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
                    {participant.invoicedAmount > 0 && (
                      <span className="text-white/60 text-sm font-medium">
                        {fmt(participant.invoicedAmount)}
                      </span>
                    )}
                    {participant.isPaid ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">
                        ✓ Betalt
                      </span>
                    ) : participant.invoicedAmount > 0 ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">
                        Obetalt
                      </span>
                    ) : null}
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
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingParticipant(participant)}
                    className="text-white/40 hover:text-neon transition-colors"
                    title="Redigera deltagare"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-white/40 hover:text-red-400 transition-colors"
                    title="Ta bort deltagare"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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

      {editingParticipant && (
        <EditParticipantModal
          participant={editingParticipant}
          onClose={() => setEditingParticipant(null)}
          onUpdate={(data) => handleUpdateParticipant(editingParticipant.id, data)}
        />
      )}

      {showAddSessions && (
        <AddSessionsModal
          projectId={project.id}
          onClose={() => setShowAddSessions(false)}
          onAdd={handleAddSessions}
        />
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onUpdate={(data) => handleUpdateSession(editingSession.id, data)}
        />
      )}
    </div>
  )
}
