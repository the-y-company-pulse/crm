"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import type { Deal, Stage, User, Activity } from "@/lib/types";
import StageColumn from "./StageColumn";
import DealCard from "./DealCard";
import DealDetail from "./DealDetail";
import Toolbar from "./Toolbar";
import NewDealModal from "./NewDealModal";
import { useIsMobile } from "@/hooks/useMediaQuery";
import MobileStageSelector from "./MobileStageSelector";
import MobileDealCard from "./MobileDealCard";

type Props = {
  initialDeals: Deal[];
  stages: Stage[];
  users: User[];
  currentUserId: string;
};

export default function Kanban({ initialDeals, stages, users, currentUserId }: Props) {
  const isMobile = useIsMobile();
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string | "all">("all");
  const [showLost, setShowLost] = useState(false);
  const [showWon, setShowWon] = useState(false);

  // State för mobil single-column view
  const visibleStages = stages.filter((s) => {
    if (!showLost && s.status === "lost") return false;
    if (!showWon && s.status === "won") return false;
    return true;
  });
  const [selectedMobileStage, setSelectedMobileStage] = useState<string>(
    visibleStages[0]?.id || stages[0]?.id || ""
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragStart(e: DragStartEvent) {
    const deal = deals.find((d) => d.id === e.active.id);
    if (deal) setActiveDeal(deal);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = e;
    if (!over) return;
    const dealId = String(active.id);
    const newStageId = String(over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === newStageId) return;

    // Optimistic update
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stageId: newStageId } : d)));
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });
    } catch {
      // Revert on failure
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stageId: deal.stageId } : d)));
    }
  }

  async function handleAddActivity(dealId: string, type: Activity["type"], content: string) {
    const res = await fetch(`/api/deals/${dealId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content, userId: currentUserId }),
    });
    if (!res.ok) return;
    const newActivity: Activity = await res.json();
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, activities: [newActivity, ...(d.activities ?? [])] }
          : d
      )
    );
  }

  function handleDealUpdate(updated: Deal) {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  async function handleCreateDeal(data: {
    title: string;
    companyId: string | null;
    company: string | null;
    contactId: string | null;
    contact: string | null;
    value: number;
    stageId: string;
    ownerId: string;
  }) {
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const created: Deal = await res.json();
    // Attach owner reference for immediate render
    const owner = users.find((u) => u.id === created.ownerId);
    setDeals((prev) => [{ ...created, owner, activities: [] }, ...prev]);
    setShowNewDeal(false);
  }

  // Handle move for mobile cards
  async function handleMoveDeal(dealId: string, newStageId: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === newStageId) return;

    // Optimistic update
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stageId: newStageId } : d)));
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStageId }),
      });
    } catch {
      // Revert on failure
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stageId: deal.stageId } : d)));
    }
  }

  const visibleDeals = ownerFilter === "all" ? deals : deals.filter((d) => d.ownerId === ownerFilter);
  const selectedDeal = deals.find((d) => d.id === selectedDealId) ?? null;

  // Only count deals in visible stages for pipeline metrics
  const visibleStageIds = new Set(visibleStages.map((s) => s.id));
  const pipelineDeals = visibleDeals.filter((d) => visibleStageIds.has(d.stageId));

  // Mobile view
  if (isMobile) {
    const dealsInStage = visibleDeals.filter((d) => d.stageId === selectedMobileStage);
    // Attach stage info to each stage for the selector
    const stagesWithCounts = visibleStages.map(stage => ({
      ...stage,
      deals: visibleDeals.filter(d => d.stageId === stage.id)
    }));

    return (
      <div className="flex flex-col min-h-screen">
        <Toolbar
          users={users}
          ownerFilter={ownerFilter}
          onOwnerFilterChange={setOwnerFilter}
          onNewDeal={() => setShowNewDeal(true)}
          dealCount={pipelineDeals.length}
          totalValue={pipelineDeals.reduce((sum, d) => sum + d.value, 0)}
          showLost={showLost}
          onToggleLost={() => setShowLost(!showLost)}
          showWon={showWon}
          onToggleWon={() => setShowWon(!showWon)}
        />

        <MobileStageSelector
          stages={stagesWithCounts}
          selectedStageId={selectedMobileStage}
          onChange={setSelectedMobileStage}
        />

        {/* Single column of cards */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-3 overflow-y-auto">
          {dealsInStage.length === 0 ? (
            <p className="text-white/40 text-center py-12 text-sm">
              Inga affärer i denna fas
            </p>
          ) : (
            dealsInStage.map((deal) => (
              <MobileDealCard
                key={deal.id}
                deal={deal}
                onOpen={() => setSelectedDealId(deal.id)}
                onMove={handleMoveDeal}
                stages={visibleStages}
              />
            ))
          )}
        </div>

        {selectedDeal && (
          <DealDetail
            deal={selectedDeal}
            users={users}
            currentUserId={currentUserId}
            onClose={() => setSelectedDealId(null)}
            onAddActivity={(type, content) => handleAddActivity(selectedDeal.id, type, content)}
            onDealUpdate={handleDealUpdate}
          />
        )}

        {showNewDeal && (
          <NewDealModal
            stages={stages}
            users={users}
            currentUserId={currentUserId}
            onClose={() => setShowNewDeal(false)}
            onCreate={handleCreateDeal}
          />
        )}
      </div>
    );
  }

  // Desktop view (original kanban board)
  return (
    <div className="flex flex-col min-h-screen">
      <Toolbar
        users={users}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        onNewDeal={() => setShowNewDeal(true)}
        dealCount={pipelineDeals.length}
        totalValue={pipelineDeals.reduce((sum, d) => sum + d.value, 0)}
        showLost={showLost}
        onToggleLost={() => setShowLost(!showLost)}
        showWon={showWon}
        onToggleWon={() => setShowWon(!showWon)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex-1 overflow-x-auto px-4 md:px-8 pb-8">
          <div className="flex gap-3 md:gap-4 h-full" style={{ minWidth: `${visibleStages.length * 280}px` }}>
            {visibleStages.map((stage) => {
              const stageDeals = visibleDeals.filter((d) => d.stageId === stage.id);
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  onCardClick={(id) => setSelectedDealId(id)}
                  selectedDealId={selectedDealId}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {selectedDeal && (
        <DealDetail
          deal={selectedDeal}
          users={users}
          currentUserId={currentUserId}
          onClose={() => setSelectedDealId(null)}
          onAddActivity={(type, content) => handleAddActivity(selectedDeal.id, type, content)}
          onDealUpdate={handleDealUpdate}
        />
      )}

      {showNewDeal && (
        <NewDealModal
          stages={stages}
          users={users}
          currentUserId={currentUserId}
          onClose={() => setShowNewDeal(false)}
          onCreate={handleCreateDeal}
        />
      )}
    </div>
  );
}
