"use client"

import { useState } from "react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/useMediaQuery"
import type { ProjectWithStats } from "@/lib/types"
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/types"
import NewProjectModal from "./NewProjectModal"

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
    setProjects([created, ...projects])
    setShowNewModal(false)
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

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projekt/${project.id}`}
              className="bg-navy/80 border border-white/[0.15] rounded-lg p-4 touch-target transition-all hover:bg-navy"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
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
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nytt projekt
        </button>
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

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.05] border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Projekt</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Datum</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deltagare</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Deals</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Pris</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr
                key={project.id}
                className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/projekt/${project.id}`}
                    className="text-white font-medium hover:text-neon transition-colors"
                  >
                    {project.name}
                  </Link>
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
                <td className="px-6 py-4 text-white/60 text-sm">
                  {fmt(project.pricePerParticipant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
