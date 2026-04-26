"use client"

import { useState, useEffect, useRef } from "react"

type Project = {
  id: string
  name: string
  startDate: string
  status: string
  _count: { participants: number }
}

type Props = {
  value: string | null // project ID
  onChange: (projectId: string | null) => void
  placeholder?: string
}

export default function ProjectAutocomplete({
  value,
  onChange,
  placeholder = "Sök projekt...",
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  // Fetch recent projects on mount
  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch('/api/projects/search?q=')
        const data = await res.json()
        setRecentProjects(data.slice(0, 5)) // Top 5 most recent
      } catch {
        setRecentProjects([])
      }
    }
    fetchRecent()
  }, [])

  // Fetch project name if value is set
  useEffect(() => {
    if (value && !selectedProject) {
      fetch(`/api/projects/${value}`)
        .then((res) => res.json())
        .then((project) => {
          isSelectingRef.current = true
          setSelectedProject(project)
          setQuery(project.name)
          setTimeout(() => {
            isSelectingRef.current = false
          }, 0)
        })
        .catch(() => {})
    }
  }, [value, selectedProject])

  // Search projects
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/projects/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(project: Project) {
    isSelectingRef.current = true
    setSelectedProject(project)
    setQuery(project.name)
    onChange(project.id)
    setShowDropdown(false)
    // Reset flag after state updates
    setTimeout(() => {
      isSelectingRef.current = false
    }, 0)
  }

  function handleClear() {
    setQuery("")
    setSelectedProject(null)
    onChange(null)
    setResults([])
  }

  return (
    <div ref={wrapperRef} className="relative z-10">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            // Only reset if not programmatically selecting
            if (!isSelectingRef.current) {
              setSelectedProject(null)
              onChange(null)
            }
          }}
          onFocus={() => {
            if (query.length >= 2) {
              setShowDropdown(true)
            } else if (recentProjects.length > 0) {
              // Show recent projects when focused with empty query
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className="input pr-20"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-[100] mt-1 w-full bg-ink-900 rounded-lg border border-white/[0.08] shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-white/40 text-sm">Söker...</div>
          ) : results.length > 0 ? (
            <div>
              {results.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelect(project)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.05] last:border-0"
                >
                  <div className="text-white font-medium">{project.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {new Date(project.startDate).toLocaleDateString("sv-SE")} •{" "}
                    {project._count.participants} deltagare
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3 text-white/40 text-sm">Inga projekt hittades</div>
          ) : recentProjects.length > 0 ? (
            <div>
              <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/40 border-b border-white/[0.05]">
                Senaste projekten
              </div>
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelect(project)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.05] last:border-0"
                >
                  <div className="text-white font-medium">{project.name}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {new Date(project.startDate).toLocaleDateString("sv-SE")} •{" "}
                    {project._count.participants} deltagare
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
