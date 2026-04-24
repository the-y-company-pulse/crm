"use client"

import { useState } from "react"

const COLORS = [
  { value: "#deff00", label: "Neon Yellow" },
  { value: "#1D9E75", label: "Green" },
  { value: "#378ADD", label: "Blue" },
  { value: "#7F77DD", label: "Purple" },
  { value: "#E74C3C", label: "Red" },
  { value: "#F39C12", label: "Orange" },
]

export default function AddUserModal({
  onClose,
  onUserCreated
}: {
  onClose: () => void
  onUserCreated: (user: any) => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [color, setColor] = useState(COLORS[0].value)
  const [role, setRole] = useState<"user" | "admin">("user")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const initial = name.trim()[0]?.toUpperCase() || "?"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          color,
          initial,
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.fieldErrors ? "Vänligen fyll i alla fält korrekt" : data.error)
        return
      }

      onUserCreated(data)
    } catch {
      setError("Något gick fel. Försök igen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-strong rounded-2xl w-full max-w-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-white">Lägg till användare</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-3xl leading-none">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Namn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              minLength={8}
              disabled={loading}
            />
            <p className="text-xs text-white/40 mt-1">Minst 8 tecken</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Färg</label>
              <select value={color} onChange={(e) => setColor(e.target.value)} className="input">
                {COLORS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-ink-900">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Roll</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="input">
                <option value="user" className="bg-ink-900">Användare</option>
                <option value="admin" className="bg-ink-900">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Avbryt
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Skapar..." : "Skapa användare"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
