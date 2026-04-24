"use client"

import { useState, useEffect, useRef } from "react"

type Contact = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  title: string | null
  company: {
    id: string
    name: string
  } | null
  _count: { deals: number }
}

type Props = {
  value: string | null // contact ID
  onChange: (contactId: string | null, contactName: string | null) => void
  companyId?: string | null // Filter by company
  placeholder?: string
  allowCreate?: boolean
}

export default function ContactAutocomplete({
  value,
  onChange,
  companyId,
  placeholder = "Sök kontakt...",
  allowCreate = true,
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Fetch contact name if value is set
  useEffect(() => {
    if (value && !selectedContact) {
      fetch(`/api/contacts/${value}`)
        .then((res) => res.json())
        .then((contact) => {
          setSelectedContact(contact)
          setQuery(contact.fullName)
        })
        .catch(() => {})
    }
  }, [value, selectedContact])

  // Search contacts
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        let url = `/api/contacts/search?q=${encodeURIComponent(query)}`
        if (companyId) {
          url += `&companyId=${companyId}`
        }
        const res = await fetch(url)
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
  }, [query, companyId])

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

  function handleSelect(contact: Contact) {
    setSelectedContact(contact)
    setQuery(contact.fullName)
    onChange(contact.id, contact.fullName)
    setShowDropdown(false)
  }

  function handleCreateNew() {
    // If there are similar results, show warning
    if (results.length > 0) {
      setShowDuplicateWarning(true)
      return
    }

    // Otherwise create directly
    onChange(null, query)
    setShowDropdown(false)
  }

  function handleConfirmCreate() {
    onChange(null, query)
    setShowDropdown(false)
    setShowDuplicateWarning(false)
  }

  function handleClear() {
    setQuery("")
    setSelectedContact(null)
    onChange(null, null)
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
            setSelectedContact(null)
            onChange(null, null)
          }}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
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
          ) : results.length === 0 ? (
            <div className="px-4 py-3">
              <div className="text-white/40 text-sm mb-2">Inga kontakter hittades</div>
              {allowCreate && query.length >= 2 && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-3 py-2 rounded-lg bg-neon/10 hover:bg-neon/20 text-neon text-sm font-medium"
                >
                  + Skapa ny: "{query}"
                </button>
              )}
            </div>
          ) : (
            <div>
              {results.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelect(contact)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-white/[0.05] last:border-0"
                >
                  <div className="text-white font-medium">{contact.fullName}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {contact.company?.name && `${contact.company.name} • `}
                    {contact.title && `${contact.title} • `}
                    {contact.email || contact.phone || ""}
                    {contact._count.deals > 0 &&
                      ` • ${contact._count.deals} deal${contact._count.deals !== 1 ? "s" : ""}`}
                  </div>
                </button>
              ))}
              {allowCreate && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] text-neon text-sm font-medium border-t border-white/[0.08]"
                >
                  + Skapa ny: "{query}"
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-ink-900 border border-white/[0.12] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-display text-lg text-white mb-1">Liknande kontakter hittades</h3>
                <p className="text-white/60 text-sm">
                  Det finns {results.length} befintliga kontakter som liknar "{query}". Vill du verkligen skapa en ny?
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {results.slice(0, 3).map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    handleSelect(contact)
                    setShowDuplicateWarning(false)
                  }}
                  className="w-full text-left p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  <div className="text-white font-medium text-sm">{contact.fullName}</div>
                  <div className="text-white/40 text-xs mt-1">
                    {contact.company?.name && `${contact.company.name} • `}
                    {contact.email || contact.phone || ""}
                    {contact._count.deals > 0 && ` • ${contact._count.deals} deals`}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDuplicateWarning(false)}
                className="btn-secondary flex-1"
              >
                Avbryt
              </button>
              <button
                onClick={handleConfirmCreate}
                className="btn-primary flex-1"
              >
                Skapa ny ändå
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
