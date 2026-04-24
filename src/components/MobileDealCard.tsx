"use client";

import type { Deal, Stage } from "@/lib/types";

type Props = {
  deal: Deal;
  onOpen: () => void;
  onMove: (dealId: string, newStageId: string) => Promise<void>;
  stages: Stage[];
};

export default function MobileDealCard({ deal, onOpen, onMove, stages }: Props) {
  const currentStageIndex = stages.findIndex(s => s.id === deal.stageId);
  const prevStage = stages[currentStageIndex - 1];
  const nextStage = stages[currentStageIndex + 1];

  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";

  // Get company and contact from normalized or fallback to fritext
  const companyName = (deal as any).company_rel?.name || deal.company;
  const contactName = (deal as any).contact_rel?.fullName || deal.contact;

  return (
    <div
      className="bg-navy/80 border border-white/[0.15] rounded-lg p-4 transition-all hover:bg-navy"
      style={{ borderLeftColor: deal.owner?.color || '#888', borderLeftWidth: '4px' }}
    >
      {/* Card content - klickbar för att öppna */}
      <div onClick={onOpen} className="cursor-pointer touch-target">
        <h3 className="text-base font-medium text-white mb-2 leading-snug">{deal.title}</h3>

        {(companyName || contactName) && (
          <p className="text-sm text-white/60 mb-3">
            {[companyName, contactName].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-neon">{fmt(deal.value)}</p>

          {/* Owner dot */}
          {deal.owner && (
            <span
              className="owner-dot w-7 h-7 text-xs"
              style={{
                background: deal.owner.color,
                color: deal.owner.color === "#deff00" ? "#0a1420" : "white"
              }}
            >
              {deal.owner.initial}
            </span>
          )}
        </div>
      </div>

      {/* Move buttons - visas bara om det finns andra faser att flytta till */}
      {(prevStage || nextStage) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.08]">
          {prevStage && (
            <button
              onClick={() => onMove(deal.id, prevStage.id)}
              className="flex-1 touch-target px-3 py-2 text-xs bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.15] border border-white/[0.10] rounded-md text-white/80 transition-colors font-medium"
            >
              ← {prevStage.name}
            </button>
          )}
          {nextStage && (
            <button
              onClick={() => onMove(deal.id, nextStage.id)}
              className="flex-1 touch-target px-3 py-2 text-xs bg-white/[0.05] hover:bg-white/[0.10] active:bg-white/[0.15] border border-white/[0.10] rounded-md text-white/80 transition-colors font-medium"
            >
              {nextStage.name} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
