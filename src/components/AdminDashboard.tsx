"use client"

import { useState } from "react"
import AddUserModal from "./AddUserModal"

type User = {
  id: string
  name: string
  email: string
  role: string
  color: string
  initial: string
  createdAt: string
}

export default function AdminDashboard({
  users: initialUsers,
  currentUserId
}: {
  users: User[]
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers)
  const [showAddUser, setShowAddUser] = useState(false)

  async function handleDeleteUser(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna användare?")) return

    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      setUsers(users.filter((u) => u.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || "Kunde inte ta bort användare")
    }
  }

  function handleUserCreated(user: User) {
    setUsers([...users, user])
    setShowAddUser(false)
  }

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-white">Användarhantering</h1>
        <button onClick={() => setShowAddUser(true)} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Lägg till användare
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/[0.05] border-b border-white/[0.08]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Användare</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Roll</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Registrerad</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="owner-dot w-8 h-8 text-xs"
                      style={{ background: user.color, color: user.color === "#deff00" ? "#0a1420" : "white" }}
                    >
                      {user.initial}
                    </span>
                    <span className="text-white font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-neon/20 text-neon"
                      : "bg-white/[0.05] text-white/60"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Användare"}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm">
                  {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                </td>
                <td className="px-6 py-4 text-right">
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Ta bort
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  )
}
