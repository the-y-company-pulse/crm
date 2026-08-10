"use client"

import { useState } from "react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/useMediaQuery"
import type { ProjectWithStats } from "@/lib/types"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/types"
import NewProjectModal from "./NewProjectModal"
import ProjectTimeline from "./ProjectTimeline"

export default function ProjectList({
  projects: initialProjects
}: {
  projects: ProjectWithStats[]
}) {
  const isMobile = useIsMobile()
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showNewModal, setShowNewModal] = useState(false)
  const [view, setView] = useState<"list" | "timeline">("list")

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalParticipants = projects.reduce((sum, p) => sum + p._count.participants, 0)

  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK"

  async function handleCreate(data: any) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    const created = await res.json()
    // POST returns the bare project (+_count) without the derived invoiced/paid
    // totals or milestones; default them so the list and timeline render cleanly.
    setProjects([{ invoiced: 0, paid: 0, milestones: [], ...created }, ...projects])
    setShowNewModal(false)
  }

  async function handleToggleFavorite(e: React.MouseEvent, project: ProjectWithStats) {
    e.preventDefault()
    e.stopPropagation()
    const next = !project.isFavorite
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, isFavorite: next } : p)))
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      })
      if (!res.ok) throw new Error("Failed to update")
    } catch (err) {
      console.error("Failed to toggle favorite:", err)
      setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, isFavorite: !next } : p)))
    }
  }

  async function handleDelete(e: React.MouseEvent, project: ProjectWithStats) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Är du säker på att du vill ta bort projektet "${project.name}"? Detta går inte att ångra.`)) return
    const prev = projects
    setProjects(projects.filter((p) => p.id !== project.id))
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    } catch (err) {
      console.error("Failed to delete:", err)
      alert("Kunde inte ta bort projektet")
      setProjects(prev)
    }
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className="px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-display text-2xl text-white mb-2">Projekt</h1>
          <div className="text-white/40 text-xs">
            {projects.length} projekt · {totalParticipants} deltagare
          </div>
        </div>

        <div className="mb-4">
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök projekt..."
            className="input w-full"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full"
          >
            <option value="all">Alla statusar</option>
            <option value="planned">Planerad</option>
            <option value="open">Öppen</option>
            <option value="full">Full</option>
            <option value="completed">Genomförd</option>
          </select>
        </div>

        {/* Timeline view */}
        {view === "timeline" && <ProjectTimeline projects={filtered} />}

        {/* Cards */}
        {view === "list" && (
        <div className="flex flex-col gap-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projekt/${project.id}`}
              className="bg-navy/80 border border-white/[0.15] rounded-lg p-4 touch-target transition-all hover:bg-navy"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <button
                  onClick={(e) => handleToggleFavorite(e, project)}
                  className={`touch-target -ml-1 mt-0.5 ${project.isFavorite ? "text-neon" : "text-white/25 hover:text-white/60"} transition-colors`}
                  aria-label={project.isFavorite ? "Ta bort från favoriter" : "Favoritmarkera"}
                  title={project.isFavorite ? "Visas på dashboard" : "Favoritmarkera – visa på dashboard"}
                >
                  <StarIcon filled={project.isFavorite} />
                </button>
                <h3 className="text-base font-medium text-white flex-1">{project.name}</h3>
                <span
                  className="px-2 py-1 text-xs rounded"
                  style={{
                    background: PROJECT_STATUS_COLORS[project.status] + "20",
                    color: PROJECT_STATUS_COLORS[project.status],
                  }}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
                <button
                  onClick={(e) => handleDelete(e, project)}
                  className="touch-target px-2 py-1 text-xs rounded text-white/40 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                  aria-label="Ta bort projekt"
                >
                  🗑
                </button>
              </div>
              <p className="text-sm text-white/60 mb-3">
                {new Date(project.startDate).toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="flex items-center justify-between text-xs text-white/50">
                <div>
                  {project._count.participants}/{project.maxParticipants} deltagare
                </div>
                <div>{project._count.deals} deals</div>
              </div>
            </Link>
          ))}
        </div>
        )}

        {showNewModal && (
          <NewProjectModal
            onClose={() => setShowNewModal(false)}
            onCreate={handleCreate}
          />
        )}

        {/* FAB */}
        <button onClick={() => setShowNewModal(true)} className="fab">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    )
  }

  // Desktop table view
  return (
    <div className="px-8 py-8">
      {/* Header with stats and button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Projekt</h1>
          <div className="text-white/40 text-sm">
            {projects.length} projekt · {totalParticipants} deltagare
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nytt projekt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök projekt..."
          className="input flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-48"
        >
          <option value="all">Alla statusar</option>
          <option value="planned">Planerad</option>
          <option value="open">Öppen</option>
          <option value="full">Full</option>
          <option value="completed">Genomförd</option>
        </select>
      </div>

      {/* Timeline view */}
      {view === "timeline" ? (
        <ProjectTimeline projects={filtered} />
      ) : (
      /* Table */
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.05] border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Projekt</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Datum</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deltagare</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deals</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Fakturerat</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Betalt</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-white/70"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr
                key={project.id}
                className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => handleToggleFavorite(e, project)}
                      className={`${project.isFavorite ? "text-neon" : "text-white/20 hover:text-white/50"} transition-colors`}
                      aria-label={project.isFavorite ? "Ta bort från favoriter" : "Favoritmarkera"}
                      title={project.isFavorite ? "Visas på dashboard" : "Favoritmarkera – visa på dashboard"}
                    >
                      <StarIcon filled={project.isFavorite} />
                    </button>
                    <Link
                      href={`/projekt/${project.id}`}
                      className="text-white font-medium hover:text-neon transition-colors"
                    >
                      {project.name}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {new Date(project.startDate).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      background: PROJECT_STATUS_COLORS[project.status] + "20",
                      color: PROJECT_STATUS_COLORS[project.status],
                    }}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {project._count.participants}/{project.maxParticipants}
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {project._count.deals}
                </td>
                <td className="px-6 py-4 text-right text-white/60 text-sm">
                  {fmt(project.invoiced)}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <span className="text-neon font-medium">
                    {fmt(project.paid)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={(e) => handleDelete(e, project)}
                    className="px-2 py-1 text-xs rounded text-white/40 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                    aria-label="Ta bort projekt"
                  >
                    🗑 Ta bort
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "list" | "timeline"
  onChange: (v: "list" | "timeline") => void
}) {
  return (
    <div className="inline-flex p-1 bg-white/[0.03] border border-white/[0.10] rounded-lg">
      <button
        onClick={() => onChange("list")}
        className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "list" ? "bg-white/[0.10] text-white" : "text-white/50 hover:text-white/80"
        }`}
      >
        Lista
      </button>
      <button
        onClick={() => onChange("timeline")}
        className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors ${
          view === "timeline" ? "bg-white/[0.10] text-white" : "text-white/50 hover:text-white/80"
        }`}
      >
        Tidslinje
      </button>
    </div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.5a.56.56 0 011.04 0l2.08 4.21c.08.17.24.29.42.31l4.65.68c.46.07.64.63.31.95l-3.36 3.28a.56.56 0 00-.16.5l.79 4.62c.08.46-.4.81-.81.59l-4.16-2.19a.56.56 0 00-.52 0l-4.16 2.19c-.41.22-.89-.13-.81-.59l.79-4.62a.56.56 0 00-.16-.5L3.37 9.65c-.33-.32-.15-.88.31-.95l4.65-.68a.56.56 0 00.42-.31L11.48 3.5z"
      />
    </svg>
  )
}
