"use client";

import type { User } from "@/lib/types";

type Props = {
  users: User[];
  currentUserId: string;
  onCurrentUserChange: (id: string) => void;
  ownerFilter: string | "all";
  onOwnerFilterChange: (id: string | "all") => void;
  onNewDeal: () => void;
  dealCount: number;
  totalValue: number;
  showLost: boolean;
  onToggleLost: () => void;
  showWon: boolean;
  onToggleWon: () => void;
};

export default function Toolbar({
  users,
  currentUserId,
  onCurrentUserChange,
  ownerFilter,
  onOwnerFilterChange,
  onNewDeal,
  dealCount,
  totalValue,
  showLost,
  onToggleLost,
  showWon,
  onToggleWon,
}: Props) {
  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";

  return (
    <header className="px-8 py-4 flex items-center justify-between gap-6 flex-wrap border-b border-white/[0.06]">
      <div className="text-sm text-white/50 flex items-center gap-2">
        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-white font-semibold text-base">{dealCount}</span> affärer · <span className="text-white font-semibold text-base">{fmt(totalValue)}</span> i pipeline
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg p-1.5">
          <button
            onClick={() => onOwnerFilterChange("all")}
            className={`px-4 py-2 text-sm rounded-md transition-colors font-medium flex items-center gap-2 ${
              ownerFilter === "all"
                ? "bg-white/[0.10] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Alla
          </button>
          {users.map((u) => {
            const active = ownerFilter === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onOwnerFilterChange(u.id)}
                className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 font-medium ${
                  active ? "bg-white/[0.10] text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: u.color }} />
                {u.name}
              </button>
            );
          })}
        </div>

        <select
          value={currentUserId}
          onChange={(e) => onCurrentUserChange(e.target.value)}
          className="input py-2.5 text-sm w-auto font-medium"
          title="Inloggad som"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id} className="bg-ink-900">
              Inloggad: {u.name}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleLost}
          className="btn-ghost text-sm font-medium flex items-center gap-2"
          title={showLost ? "Dölj förlorade" : "Visa förlorade"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showLost ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
          {showLost ? "Dölj förlorade" : "Visa förlorade"}
        </button>

        <button
          onClick={onToggleWon}
          className="btn-ghost text-sm font-medium flex items-center gap-2"
          title={showWon ? "Dölj vunna" : "Visa vunna"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showWon ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            )}
          </svg>
          {showWon ? "Dölj vunna" : "Visa vunna"}
        </button>

        <button onClick={onNewDeal} className="btn btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ny affär
        </button>
      </div>
    </header>
  );
}
