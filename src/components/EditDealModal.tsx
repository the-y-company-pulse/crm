"use client";

import { useState } from "react";
import type { Deal, User } from "@/lib/types";
import CompanyAutocomplete from "./CompanyAutocomplete";
import ContactAutocomplete from "./ContactAutocomplete";

type Props = {
  deal: Deal;
  users: User[];
  onClose: () => void;
  onSaved: (updated: Deal) => void;
};

export default function EditDealModal({ deal, users, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(deal.title);
  const [companyId, setCompanyId] = useState<string | null>((deal as any).companyId ?? null);
  const [companyName, setCompanyName] = useState<string | null>(deal.company ?? null);
  const [contactId, setContactId] = useState<string | null>((deal as any).contactId ?? null);
  const [contactName, setContactName] = useState<string | null>(deal.contact ?? null);
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
          companyId,
          company: companyName,
          contactId,
          contact: contactName,
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
    <div className="fixed inset-0 bg-ink-950/90 md:bg-black/60 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-navy-800 border-0 md:border md:border-white/[0.12] rounded-none md:rounded-2xl max-w-lg w-full h-full md:h-auto p-4 md:p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="font-display text-lg md:text-xl text-white">Redigera affär</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition text-3xl leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Företag
              </label>
              <CompanyAutocomplete
                value={companyId}
                onChange={(id, name) => {
                  setCompanyId(id);
                  setCompanyName(name);
                }}
                placeholder="Sök eller skapa företag..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Kontaktperson
              </label>
              <ContactAutocomplete
                value={contactId}
                onChange={(id, name) => {
                  setContactId(id);
                  setContactName(name);
                }}
                companyId={companyId}
                placeholder="Sök eller skapa kontakt..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                Ansvarig
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

        <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary touch-target flex-1 flex items-center justify-center gap-2" disabled={saving}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Avbryt
          </button>
          <button
            onClick={handleSave}
            className="btn-primary touch-target flex-1 flex items-center justify-center gap-2"
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
