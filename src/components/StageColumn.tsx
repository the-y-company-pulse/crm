"use client";

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
  const total = deals.reduce((sum, d) => sum + d.value, 0);
  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";

  // Highlight terminal stages
  const isTerminal = stage.status === "won" || stage.status === "lost";

  return (
    <div ref={setNodeRef} className={`y-col flex-1 min-w-[280px] max-w-[350px] ${isOver ? "is-over" : ""}`}>
      <div className="px-2 pb-4 flex items-center justify-between">
        <div>
          <div className={`text-base font-semibold ${isTerminal ? "text-white/70" : "text-white"}`}>
            {stage.name}
          </div>
          <div className="text-sm text-white/40 mt-1">
            {deals.length} aff · {fmt(total)}
          </div>
        </div>
        {isTerminal && (
          <span
            className={`w-2 h-2 rounded-full ${
              stage.status === "won" ? "bg-green-400" : "bg-red-400/80"
            }`}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto -mx-2 px-2">
        {deals.length === 0 ? (
          <div className="text-sm text-white/20 text-center py-6">Tomt</div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isSelected={deal.id === selectedDealId}
              onClick={() => onCardClick(deal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
