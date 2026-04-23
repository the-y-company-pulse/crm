"use client";

import { useState } from "react";
import type { Deal, User } from "@/lib/types";

type Props = {
  deal: Deal;
  users: User[];
  onClose: () => void;
  onSaved: (updated: Deal) => void;
};

export default function EditDealModal({ deal, users, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(deal.title);
  const [company, setCompany] = useState(deal.company ?? "");
  const [contact, setContact] = useState(deal.contact ?? "");
  const [email, setEmail] = useState(deal.email ?? "");
  const [phone, setPhone] = useState(deal.phone ?? "");
  const [value, setValue] = useState(deal.value.toString());
  const [ownerId, setOwnerId] = useState(deal.ownerId);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim() || null,
          contact: contact.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          value: parseInt(value.replace(/\s/g, ""), 10) || 0,
          ownerId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated: Deal = await res.json();
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error("Failed to save deal:", err);
      setSaving(false);
    }
  }

  const fmt = (v: string) => {
    const num = parseInt(v.replace(/\s/g, ""), 10);
    return isNaN(num) ? "" : num.toLocaleString("sv-SE");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/[0.12] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">Redigera affär</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition text-2xl leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Ledarskapsprogram Volvo"
              className="input w-full"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Företag
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="T.ex. Volvo AB"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Kontaktperson
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="T.ex. Anna Svensson"
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anna@volvo.se"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070-123 45 67"
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Värde
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/\s/g, ""))}
                  onBlur={(e) => setValue(fmt(e.target.value))}
                  placeholder="0"
                  className="input w-full pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  kr
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Ansvarig partner
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="input w-full"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-ink-900">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 flex items-center justify-center gap-2" disabled={saving}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={!title.trim() || saving}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
