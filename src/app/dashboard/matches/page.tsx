"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/components/features/match-card";
import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Doc } from "../../../../convex/_generated/dataModel";

type MatchResult = {
  musician: Doc<"musicians">;
  score: number;
  matchReasons: string[];
};

const STATUS_BADGE: Record<string, "default" | "success" | "warning" | "info"> = {
  open: "info",
  hold: "warning",
  booked: "success",
};

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const openDates = useQuery(api.openDates.listByVenue);
  const [selectedId, setSelectedId] = useState<Id<"openDates"> | null>(null);

  // Pre-select open date from URL param
  useEffect(() => {
    if (dateParam && openDates && !selectedId) {
      const match = openDates.find((od: Doc<"openDates">) => od.date === dateParam);
      if (match) setSelectedId(match._id);
    }
  }, [dateParam, openDates, selectedId]);

  const matches = useQuery(
    api.matches.getForOpenDate,
    selectedId ? { openDateId: selectedId } : "skip"
  );

  const selectedOpenDate = openDates?.find((od: Doc<"openDates">) => od._id === selectedId);

  if (openDates === undefined) {
    return (
      <div className="max-w-content mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    );
  }

  const activeOpenDates = openDates.filter(
    (od: Doc<"openDates">) => od.status !== "cancelled"
  );

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Matches</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left panel — open dates list */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-text-muted mb-3">
            Open Dates
          </h2>
          {activeOpenDates.length === 0 ? (
            <Card className="text-center py-8">
              <Calendar size={24} className="mx-auto text-text-muted mb-2" />
              <p className="text-sm text-text-muted">No open dates yet</p>
            </Card>
          ) : (
            activeOpenDates.map((od: Doc<"openDates">) => {
              const displayDate = new Date(
                od.date + "T12:00:00"
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                weekday: "short",
              });

              return (
                <button
                  key={od._id}
                  type="button"
                  onClick={() => setSelectedId(od._id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    selectedId === od._id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {displayDate}
                    </span>
                    <Badge variant={STATUS_BADGE[od.status] ?? "default"}>
                      {od.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {od.genres.slice(0, 3).join(", ")}
                    {od.genres.length > 3 && ` +${od.genres.length - 3}`}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right panel — matches */}
        <div className="md:col-span-2">
          {!selectedId ? (
            <Card className="text-center py-16">
              <Users size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">
                Select an open date to see matched musicians
              </p>
            </Card>
          ) : matches === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : matches.length === 0 ? (
            <Card className="text-center py-16">
              <Users size={32} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-muted">
                No matching musicians found for this date
              </p>
              <p className="text-xs text-text-muted mt-1">
                Musicians need at least 60% profile completeness to appear
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                {matches.length} match{matches.length !== 1 ? "es" : ""} found
              </p>
              {matches.map((match: MatchResult) => (
                <MatchCard
                  key={match.musician._id}
                  musician={match.musician}
                  score={match.score}
                  matchReasons={match.matchReasons}
                  openDateId={selectedId}
                  openDateDealType={selectedOpenDate?.dealType ?? "flat_fee"}
                  openDateBudgetMin={selectedOpenDate?.budgetMin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
