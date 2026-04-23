"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User, SalesSummary } from "@/lib/types";
import TargetModal from "./TargetModal";

type Props = {
  year: number;
  userId: string;
  users: User[];
  summary: SalesSummary;
  byUser: { user: User; summary: SalesSummary }[];
};

const MONTH_LABELS = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];

export default function StatistikDashboard({ year, userId, users, summary, byUser }: Props) {
  const router = useRouter();
  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const currentMonth = isCurrentYear ? today.getMonth() + 1 : 12;
  const [showTargetModal, setShowTargetModal] = useState(false);

  const fmt = (v: number) => v.toLocaleString("sv-SE");
  const fmtSEK = (v: number) => fmt(v) + " SEK";
  const fmtShort = (v: number) =>
    v >= 1_000_000 ? (v / 1_000_000).toFixed(1).replace(".", ",") + "M" :
    v >= 1_000 ? Math.round(v / 1_000) + "k" : String(v);

  // Same period previous year
  const samePeriodPrev = summary.monthlyPrev
    .slice(0, currentMonth)
    .reduce((s, m) => s + m.value, 0);

  // Linear forecast
  const forecast = isCurrentYear && currentMonth > 0
    ? Math.round((summary.yearTotal / currentMonth) * 12)
    : summary.yearTotal;

  const pctOfTarget = summary.yearlyTarget > 0
    ? Math.round((summary.yearTotal / summary.yearlyTarget) * 100)
    : 0;

  const monthlyTargetForMonth = (m: number) =>
    summary.monthlyTargets[m] > 0
      ? summary.monthlyTargets[m]
      : (summary.yearlyTarget > 0 ? Math.round(summary.yearlyTarget / 12) : 0);

  // Quarterly aggregates
  const quarters = [0, 1, 2, 3].map((q) => {
    const months = summary.monthlyThis.slice(q * 3, q * 3 + 3);
    const value = months.reduce((s, m) => s + m.value, 0);
    const target = [0, 1, 2].reduce((s, i) => s + monthlyTargetForMonth(q * 3 + i), 0);
    const isPast = q * 3 + 3 <= currentMonth;
    const isCurrent = q * 3 < currentMonth && currentMonth <= q * 3 + 3;
    return { q: q + 1, value, target, isPast, isCurrent };
  });

  // Chart scaling — use max of (any month value, any target) for the full year
  const chartMax = Math.max(
    ...summary.monthlyThis.map((m) => m.value),
    ...summary.monthlyPrev.map((m) => m.value),
    ...Array.from({ length: 12 }, (_, i) => monthlyTargetForMonth(i)),
    100000 // floor so empty charts look reasonable
  );
  const yScale = (v: number) => 200 - (v / chartMax) * 150; // chart area: y=50 to y=200
  const goalY = yScale(monthlyTargetForMonth(currentMonth - 1) || monthlyTargetForMonth(0));

  function setYear(y: number) {
    const params = new URLSearchParams({ year: String(y), userId });
    router.push(`/statistik?${params}`);
  }
  function setUserId(id: string) {
    const params = new URLSearchParams({ year: String(year), userId: id });
    router.push(`/statistik?${params}`);
  }

  const yearOptions = [today.getFullYear() + 1, today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2];

  return (
    <div className="px-6 py-6 flex flex-col gap-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl text-white">Försäljning {year}</h2>
          <p className="text-sm text-white/50 mt-1">
            Vunna affärer · jämfört med {year - 1}
            {summary.yearlyTarget > 0 && ` och årsmål ${fmtSEK(summary.yearlyTarget)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="input py-1.5 text-xs w-auto"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y} className="bg-ink-900">{y}</option>
            ))}
          </select>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input py-1.5 text-xs w-auto"
          >
            <option value="all" className="bg-ink-900">Alla partnerer</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-ink-900">{u.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowTargetModal(true)}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] transition"
            title="Redigera mål"
          >
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Kpi label="Vunnet hittills" value={fmt(summary.yearTotal)} unit="SEK"
             extra={summary.yearlyTarget > 0 ? `${pctOfTarget}% av årsmål` : `${summary.wonCount} affärer`}
             accent />
        <Kpi label={`Årsmål ${year}`} value={summary.yearlyTarget > 0 ? fmt(summary.yearlyTarget) : "—"}
             unit={summary.yearlyTarget > 0 ? "SEK" : ""}
             extra={summary.yearlyTarget > 0
               ? `${fmtShort(Math.round(summary.yearlyTarget / 12))} / mån i snitt`
               : "Inget mål satt"} />
        <Kpi label={`Samma period ${year - 1}`} value={fmt(samePeriodPrev)} unit="SEK"
             extra={renderDelta(summary.yearTotal, samePeriodPrev)} />
        <Kpi label="Prognos helår" value={fmt(forecast)} unit="SEK"
             extra={summary.yearlyTarget > 0 ? `${Math.round((forecast / summary.yearlyTarget) * 100)}% av mål` : "linjär"} />
      </div>

      {/* Monthly chart */}
      <div className="bg-white/[0.025] border border-white/[0.08] rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-base">Månadsöversikt</h3>
          <div className="flex gap-3 text-xs text-white/55">
            <Legend swatch="#deff00" label={String(year)} />
            <Legend swatch="rgba(148,173,186,0.4)" label={String(year - 1)} />
            {summary.yearlyTarget > 0 && <Legend line label="Mål" color="#f87171" />}
          </div>
        </div>
        <svg viewBox="0 0 660 240" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          {/* Goal line */}
          {summary.yearlyTarget > 0 && (
            <>
              <line x1="40" y1={goalY} x2="660" y2={goalY} stroke="#f87171" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <text x="44" y={goalY - 4} fill="#f87171" fontSize="9">Mål {fmtShort(monthlyTargetForMonth(0))}</text>
            </>
          )}
          {/* Baseline + grid */}
          <line x1="40" y1="200" x2="660" y2="200" stroke="rgba(255,255,255,0.1)" />
          <line x1="40" y1="125" x2="660" y2="125" stroke="rgba(255,255,255,0.05)" />
          <text x="36" y="203" fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">0</text>
          <text x="36" y="128" fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">{fmtShort(chartMax / 2)}</text>
          <text x="36" y="53" fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">{fmtShort(chartMax)}</text>
          {/* Bars */}
          {Array.from({ length: 12 }, (_, i) => {
            const x = 56 + i * 50;
            const prev = summary.monthlyPrev[i].value;
            const curr = summary.monthlyThis[i].value;
            const isFuture = isCurrentYear && i + 1 > currentMonth;
            const target = monthlyTargetForMonth(i);
            return (
              <g key={i}>
                {prev > 0 && (
                  <rect x={x + 6} y={yScale(prev)} width="22" height={200 - yScale(prev)}
                        fill="rgba(148,173,186,0.35)" rx="2" />
                )}
                {!isFuture ? (
                  curr > 0 && <rect x={x} y={yScale(curr)} width="22" height={200 - yScale(curr)}
                                    fill="#deff00" rx="2" />
                ) : (
                  target > 0 && <rect x={x} y={yScale(target)} width="22" height={200 - yScale(target)}
                                      fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"
                                      strokeDasharray="2 2" rx="2" />
                )}
                <text x={x + 11} y="218" fill="rgba(255,255,255,0.45)" fontSize="9" textAnchor="middle">
                  {MONTH_LABELS[i]}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="text-[11px] text-white/35 text-center mt-2">
          Streckade staplar = framtida månader (visar mål)
        </p>
      </div>

      {/* Quarterly + per-user */}
      <div className="grid lg:grid-cols-2 gap-3">
        <Card title="Per kvartal">
          {quarters.map((q) => {
            const pct = q.target > 0 ? Math.round((q.value / q.target) * 100) : 0;
            const opacity = q.isPast || q.isCurrent ? "" : "opacity-40";
            return (
              <Row key={q.q} className={opacity}>
                <span className="text-white/70 text-sm">Q{q.q} {year}</span>
                <span className="text-xs text-white/50 w-10 text-right">{q.target > 0 ? `${pct}%` : "—"}</span>
                <Bar pct={Math.min(pct, 100)} over={pct >= 100} />
                <span className="text-sm font-medium">{fmtShort(q.value)}</span>
              </Row>
            );
          })}
          {summary.yearlyTarget > 0 && (
            <Row className="mt-2 pt-3 border-t border-white/[0.12]">
              <span className="text-white text-sm font-medium">Helår mål</span>
              <span className="flex-1" />
              <span className="text-sm font-medium">{fmtSEK(summary.yearlyTarget)}</span>
            </Row>
          )}
        </Card>

        <Card title="Per partner">
          {byUser.map(({ user, summary: us }) => {
            const pct = us.yearlyTarget > 0 ? Math.round((us.yearTotal / us.yearlyTarget) * 100) : 0;
            const textColor = user.color === "#deff00" ? "#0a1420" : "white";
            return (
              <Row key={user.id}>
                <div className="flex items-center gap-2 min-w-[100px]">
                  <span className="owner-dot w-5 h-5"
                        style={{ background: user.color, color: textColor }}>{user.initial}</span>
                  <span className="text-white/70 text-sm">{user.name}</span>
                </div>
                <span className="text-xs text-white/50 w-10 text-right">{us.yearlyTarget > 0 ? `${pct}%` : "—"}</span>
                <Bar pct={Math.min(pct, 100)} muted={us.yearTotal === 0} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {fmtShort(us.yearTotal)}{us.yearlyTarget > 0 && ` / ${fmtShort(us.yearlyTarget)}`}
                </span>
              </Row>
            );
          })}
        </Card>
      </div>

      {summary.yearlyTarget === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-sm text-white/55">
          <strong className="text-white font-medium">Inget årsmål satt än.</strong>
          {" "}Lägg till mål för {year} via API:t (POST /api/targets) eller bygg en mål-editor som nästa feature.
        </div>
      )}

      {showTargetModal && (
        <TargetModal
          year={year}
          users={users}
          currentTargets={{
            company: summary.yearlyTarget,
            byUser: Object.fromEntries(byUser.map(({ user, summary: s }) => [user.id, s.yearlyTarget])),
          }}
          onClose={() => setShowTargetModal(false)}
        />
      )}
    </div>
  );
}

function renderDelta(current: number, prev: number): string {
  if (prev === 0) return current === 0 ? "—" : "ny period";
  const delta = current - prev;
  const pct = Math.round((delta / prev) * 100);
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${pct}% mot fjolåret`;
}

function Kpi({ label, value, unit, extra, accent }: {
  label: string; value: string; unit?: string; extra?: string; accent?: boolean;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{label}</div>
      <div className={`font-display text-2xl leading-none ${accent ? "text-neon" : "text-white"}`}>
        {value}
      </div>
      {extra && <div className="text-[11px] text-white/55 mt-2">{unit && `${unit} · `}{extra}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-white/[0.08] rounded-xl p-5">
      <h3 className="font-display text-base mb-4">{title}</h3>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-2 border-t border-white/[0.05] first:border-t-0 ${className}`}>
      {children}
    </div>
  );
}

function Bar({ pct, over, muted }: { pct: number; over?: boolean; muted?: boolean }) {
  const color = muted ? "rgba(255,255,255,0.15)" : over ? "#4ade80" : "#deff00";
  return (
    <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Legend({ swatch, line, color, label }: { swatch?: string; line?: boolean; color?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {line ? (
        <span className="w-3.5 h-0.5 border-t border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: swatch }} />
      )}
      {label}
    </span>
  );
}
