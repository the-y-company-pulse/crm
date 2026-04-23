"use client";

import { useState } from "react";
import type { User } from "@/lib/types";

type Props = {
  year: number;
  users: User[];
  currentTargets: {
    company: number; // yearlyTarget from company-wide (userId=null)
    byUser: Record<string, number>; // userId → amount
  };
  onClose: () => void;
};

export default function TargetModal({ year, users, currentTargets, onClose }: Props) {
  const [companyTarget, setCompanyTarget] = useState(currentTargets.company.toString());
  const [userTargets, setUserTargets] = useState<Record<string, string>>(
    Object.fromEntries(
      users.map((u) => [u.id, (currentTargets.byUser[u.id] || 0).toString()])
    )
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // Save company target
      const companyAmount = parseInt(companyTarget.replace(/\s/g, ""), 10) || 0;
      await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: null,
          year,
          month: null,
          amount: companyAmount,
        }),
      });

      // Save per-user targets
      for (const user of users) {
        const amount = parseInt(userTargets[user.id]?.replace(/\s/g, ""), 10) || 0;
        await fetch("/api/targets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            year,
            month: null,
            amount,
          }),
        });
      }

      // Reload page to show updated targets
      window.location.reload();
    } catch (err) {
      console.error("Failed to save targets:", err);
      setSaving(false);
    }
  }

  const fmt = (v: string) => {
    const num = parseInt(v.replace(/\s/g, ""), 10);
    return isNaN(num) ? "" : num.toLocaleString("sv-SE");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-navy-800 border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">Årsmål {year}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition text-2xl leading-none"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Company target */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
              Totalt
            </label>
            <div className="relative">
              <input
                type="text"
                value={companyTarget}
                onChange={(e) => setCompanyTarget(e.target.value.replace(/\s/g, ""))}
                onBlur={(e) => setCompanyTarget(fmt(e.target.value))}
                placeholder="0"
                className="input w-full pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                kr
              </span>
            </div>
          </div>

          {/* Per-user targets */}
          {users.map((user) => (
            <div key={user.id}>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                {user.name}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userTargets[user.id] || ""}
                  onChange={(e) =>
                    setUserTargets({ ...userTargets, [user.id]: e.target.value.replace(/\s/g, "") })
                  }
                  onBlur={(e) =>
                    setUserTargets({ ...userTargets, [user.id]: fmt(e.target.value) })
                  }
                  placeholder="0"
                  className="input w-full pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  kr
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            Avbryt
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
