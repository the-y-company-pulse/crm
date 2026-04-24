"use client";

import { useState } from "react";
import type { Stage, User } from "@/lib/types";
import CompanyAutocomplete from "./CompanyAutocomplete";
import ContactAutocomplete from "./ContactAutocomplete";
import ProjectAutocomplete from "./ProjectAutocomplete";

type Props = {
  stages: Stage[];
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    companyId: string | null;
    company: string | null;
    contactId: string | null;
    contact: string | null;
    value: number;
    stageId: string;
    ownerId: string;
    projectId?: string | null;
  }) => void | Promise<void>;
};

export default function NewDealModal({ stages, users, currentUserId, onClose, onCreate }: Props) {
  const openStages = stages.filter((s) => s.status === null);
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(openStages[0]?.id ?? stages[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        companyId,
        company: companyName,
        contactId,
        contact: contactName,
        value: parseInt(value.replace(/\D/g, ""), 10) || 0,
        stageId,
        ownerId,
        projectId,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/90 md:bg-ink-950/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-w-md p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <h2 className="font-display text-lg md:text-xl text-white">Ny affär</h2>
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white text-3xl leading-none px-2">
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Titel">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Företag">
                <CompanyAutocomplete
                  value={companyId}
                  onChange={(id, name) => {
                    setCompanyId(id);
                    setCompanyName(name);
                  }}
                  placeholder="Sök eller skapa företag..."
                />
              </Field>
              <Field label="Kontaktperson">
                <ContactAutocomplete
                  value={contactId}
                  onChange={(id, name) => {
                    setContactId(id);
                    setContactName(name);
                  }}
                  companyId={companyId}
                  placeholder="Sök eller skapa kontakt..."
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Värde (SEK)">
                <input className="input" inputMode="numeric" value={value}
                       onChange={(e) => setValue(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Ägare">
                <select className="input" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-ink-900">{u.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Fas">
              <select className="input" value={stageId} onChange={(e) => setStageId(e.target.value)}>
                {openStages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Projekt (valfritt)">
              <ProjectAutocomplete
                value={projectId}
                onChange={(id) => setProjectId(id)}
                placeholder="Sök projekt..."
              />
            </Field>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-6">
            <button onClick={onClose} className="btn touch-target flex items-center justify-center gap-2 flex-1 md:flex-initial">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Avbryt
            </button>
            <button onClick={submit} disabled={!title.trim() || submitting}
                    className="btn btn-primary touch-target disabled:opacity-40 flex items-center justify-center gap-2 flex-1 md:flex-initial">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Skapa
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
