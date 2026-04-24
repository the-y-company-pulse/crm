"use client";

import type { Stage, Deal } from "@/lib/types";

type StageWithDeals = Stage & { deals?: Deal[] };

type Props = {
  stages: StageWithDeals[];
  selectedStageId: string;
  onChange: (stageId: string) => void;
};

export default function MobileStageSelector({ stages, selectedStageId, onChange }: Props) {
  const selected = stages.find(s => s.id === selectedStageId);
  const dealCount = selected?.deals?.length || 0;

  return (
    <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
      <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">
        Fas
      </label>
      <select
        value={selectedStageId}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full text-base font-medium"
      >
        {stages.map(stage => {
          const count = stage.deals?.length || 0;
          return (
            <option key={stage.id} value={stage.id} className="bg-ink-900">
              {stage.name} ({count})
            </option>
          );
        })}
      </select>
      <p className="text-xs text-white/30 mt-2">
        {dealCount} {dealCount === 1 ? 'affär' : 'affärer'} i denna fas
      </p>
    </div>
  );
}
