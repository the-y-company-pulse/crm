"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Deal } from "@/lib/types";

type Props = {
  deal: Deal;
  isSelected?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
};

export default function DealCard({ deal, isSelected, isOverlay, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    disabled: isOverlay,
  });

  const ownerColor = deal.owner?.color ?? "#888";
  const ownerInitial = deal.owner?.initial ?? "?";
  const ownerTextColor = deal.owner?.color === "#deff00" ? "#0a1420" : "white";
  const fmt = (v: number) => v.toLocaleString("sv-SE") + " SEK";
  const activityCount = deal.activities?.length ?? 0;

  const style = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: ownerColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => { if (!isDragging) onClick?.(); }}
      className={[
        "y-card p-4",
        isDragging ? "is-dragging" : "",
        isSelected ? "is-selected" : "",
        isOverlay ? "shadow-2xl rotate-1" : "",
      ].join(" ")}
    >
      <div className="text-base font-semibold text-white leading-snug mb-1.5">
        {deal.title}
      </div>
      {(deal.company || deal.contact) && (
        <div className="text-sm text-white/50 mb-3 leading-snug">
          {[deal.company, deal.contact].filter(Boolean).join(" · ")}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/90">{fmt(deal.value)}</span>
          {activityCount > 0 && (
            <span className="text-xs text-white/30">· {activityCount} akt</span>
          )}
        </div>
        <span
          className="owner-dot w-6 h-6"
          style={{ background: ownerColor, color: ownerTextColor }}
          title={deal.owner?.name}
        >
          {ownerInitial}
        </span>
      </div>
    </div>
  );
}
