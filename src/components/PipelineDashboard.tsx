"use client";

import { useState } from "react";
import Link from "next/link";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/types";

export type FavoriteProject = {
  id: string;
  name: string;
  startDate: string;
  status: "planned" | "open" | "full" | "completed";
  count: number;
  max: number;
};

export type PartnerSales = {
  id: string;
  name: string;
  color: string;
  initial: string;
  value: number;
  count: number;
};

type Props = {
  favorites: FavoriteProject[];
  partnerSales: PartnerSales[];
  partnerSalesYear: PartnerSales[];
  monthLabel: string;
  yearLabel: string;
};

const fmtSEK = (v: number) => v.toLocaleString("sv-SE") + " SEK";

export default function PipelineDashboard({
  favorites,
  partnerSales,
  partnerSalesYear,
  monthLabel,
  yearLabel,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // Nothing favorited and no sales yet → keep the toolbar clean, render nothing.
  if (
    favorites.length === 0 &&
    partnerSales.every((p) => p.value === 0) &&
    partnerSalesYear.every((p) => p.value === 0)
  )
    return null;

  const monthTotal = partnerSales.reduce((s, p) => s + p.value, 0);
  const yearTotal = partnerSalesYear.reduce((s, p) => s + p.value, 0);

  // Merge month + year per partner into one table, sorted by yearly value.
  const yearById = new Map(partnerSalesYear.map((p) => [p.id, p]));
  const partnerRows = partnerSales
    .map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      initial: m.initial,
      monthValue: m.value,
      yearValue: yearById.get(m.id)?.value ?? 0,
    }))
    .sort((a, b) => b.yearValue - a.yearValue);

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-5">
      <div className="bg-white/[0.025] border border-white/[0.08] rounded-xl">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-neon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.5a.56.56 0 011.04 0l2.08 4.21c.08.17.24.29.42.31l4.65.68c.46.07.64.63.31.95l-3.36 3.28a.56.56 0 00-.16.5l.79 4.62c.08.46-.4.81-.81.59l-4.16-2.19a.56.56 0 00-.52 0l-4.16 2.19c-.41.22-.89-.13-.81-.59l.79-4.62a.56.56 0 00-.16-.5L3.37 9.65c-.33-.32-.15-.88.31-.95l4.65-.68a.56.56 0 00.42-.31L11.48 3.5z" />
            </svg>
            <span className="font-display text-base text-white">Översikt</span>
            <span className="text-xs text-white/40 hidden sm:inline">
              · {favorites.length} fokusprogram · {fmtSEK(monthTotal)} i {monthLabel} · {fmtSEK(yearTotal)} {yearLabel}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!collapsed && (
          <div className="grid lg:grid-cols-2 border-t border-white/[0.06]">
            {/* Favorite programs — fill rate */}
            <div className="p-4 md:p-5 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
              <h3 className="text-[11px] uppercase tracking-wider text-white/40 mb-3">
                Fokusprogram · fyllnadsgrad
              </h3>
              {favorites.length === 0 ? (
                <p className="text-sm text-white/30 py-2">
                  Favoritmarkera ett projekt (⭐) för att följa fyllnadsgraden här.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {favorites.map((p) => (
                    <FavoriteRow key={p.id} project={p} />
                  ))}
                </ul>
              )}
            </div>

            {/* Sales per partner — this month and this year */}
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-[11px] uppercase tracking-wider text-white/40 flex-1">
                  Försäljning · per partner
                </h3>
                <span className="w-24 text-right text-[10px] uppercase tracking-wider text-white/30">{monthLabel}</span>
                <span className="w-24 text-right text-[10px] uppercase tracking-wider text-white/30">{yearLabel}</span>
              </div>
              <ul className="flex flex-col gap-2">
                {partnerRows.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <span
                      className="owner-dot w-6 h-6 text-xs flex-shrink-0"
                      style={{ background: u.color, color: u.color === "#deff00" ? "#0a1420" : "white" }}
                    >
                      {u.initial}
                    </span>
                    <span className="text-sm text-white/70 flex-1 truncate">{u.name}</span>
                    <span className={`w-24 text-right text-sm whitespace-nowrap ${u.monthValue > 0 ? "text-white" : "text-white/30"}`}>
                      {fmtSEK(u.monthValue)}
                    </span>
                    <span className={`w-24 text-right text-sm font-medium whitespace-nowrap ${u.yearValue > 0 ? "text-white" : "text-white/30"}`}>
                      {fmtSEK(u.yearValue)}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-3 mt-1 pt-2 border-t border-white/[0.08]">
                  <span className="text-sm text-white/50 flex-1">Totalt</span>
                  <span className="w-24 text-right text-sm font-semibold text-white/80 whitespace-nowrap">{fmtSEK(monthTotal)}</span>
                  <span className="w-24 text-right text-sm font-semibold text-neon whitespace-nowrap">{fmtSEK(yearTotal)}</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteRow({ project }: { project: FavoriteProject }) {
  const pct = project.max > 0 ? Math.min(Math.round((project.count / project.max) * 100), 100) : 0;
  const full = project.count >= project.max && project.max > 0;
  return (
    <li>
      <Link href={`/projekt/${project.id}`} className="group block">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <span className="text-sm font-medium text-white group-hover:text-neon transition-colors truncate">
            {project.name}
          </span>
          <span className={`text-sm font-semibold whitespace-nowrap ${full ? "text-green-400" : "text-neon"}`}>
            {project.count} av {project.max}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: full ? "#4ade80" : "#deff00" }}
            />
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{
              background: PROJECT_STATUS_COLORS[project.status] + "20",
              color: PROJECT_STATUS_COLORS[project.status],
            }}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
      </Link>
    </li>
  );
}
