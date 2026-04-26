"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Deal, Stage } from "@/lib/types";
import DealCard from "./DealCard";

type Props = {
  stage: Stage;
  deals: Deal[];
  selectedDealId: string | null;
  onCardClick: (id: string) => void;
};

export default function StageColumn({ stage, deals, selectedDealId, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [showAll, setShowAll] = useState(false);

  const total = deals.reduce((sum, d) => sum + d.value, 0);
  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";

  // Highlight terminal stages
  const isTerminal = stage.status === "won" || stage.status === "lost";
  const isWon = stage.status === "won";

  // For won stage, show only 10 most recent unless "show all" is clicked
  const INITIAL_LIMIT = 10;
  let visibleDeals = deals;
  let hasMore = false;

  if (isWon && deals.length > INITIAL_LIMIT && !showAll) {
    // Sort by wonAt desc and take first 10
    const sorted = [...deals].sort((a, b) => {
      const dateA = a.wonAt ? new Date(a.wonAt).getTime() : 0;
      const dateB = b.wonAt ? new Date(b.wonAt).getTime() : 0;
      return dateB - dateA;
    });
    visibleDeals = sorted.slice(0, INITIAL_LIMIT);
    hasMore = true;
  }

  return (
    <div
      ref={setNodeRef}
      className={`y-col flex-1 min-w-[280px] max-w-[350px] ${isOver ? "is-over" : ""} ${
        isWon ? "relative" : ""
      }`}
      style={isWon ? {
        background: "linear-gradient(135deg, rgba(222, 255, 0, 0.08) 0%, rgba(222, 255, 0, 0.02) 100%)",
        border: "1px solid rgba(222, 255, 0, 0.2)",
        borderRadius: "12px",
        padding: "8px",
      } : undefined}
    >
      <div className="px-2 pb-4 flex items-center justify-between">
        <div>
          <div className={`text-base font-semibold ${isWon ? "text-neon" : isTerminal ? "text-white/70" : "text-white"}`}>
            {stage.name}
          </div>
          <div className={`text-sm mt-1 ${isWon ? "text-neon/60" : "text-white/40"}`}>
            {deals.length} aff · {fmt(total)}
          </div>
        </div>
        {isWon && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-neon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {isTerminal && !isWon && (
          <span
            className="w-2 h-2 rounded-full bg-red-400/80"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto -mx-2 px-2">
        {visibleDeals.length === 0 ? (
          <div className="text-sm text-white/20 text-center py-6">Tomt</div>
        ) : (
          <>
            {visibleDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isSelected={deal.id === selectedDealId}
                onClick={() => onCardClick(deal.id)}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="text-sm text-neon hover:text-neon/80 transition-colors py-3 px-4 rounded-lg bg-neon/5 hover:bg-neon/10 border border-neon/20 font-medium"
              >
                Visa alla {deals.length} affärer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
