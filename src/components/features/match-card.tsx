"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferForm } from "./offer-form";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { Music, MapPin, Star, ExternalLink } from "lucide-react";

interface MatchCardProps {
  musician: Doc<"musicians">;
  score: number;
  matchReasons: string[];
  openDateId: Id<"openDates">;
  openDateDealType: string;
  openDateBudgetMin?: number;
}

export function MatchCard({
  musician,
  score,
  matchReasons,
  openDateId,
  openDateDealType,
  openDateBudgetMin,
}: MatchCardProps) {
  const [showOfferForm, setShowOfferForm] = useState(false);

  const musicLinks = musician.musicLinks;
  const linkEntries = musicLinks
    ? Object.entries(musicLinks).filter(([, url]) => url && url.length > 0)
    : [];

  return (
    <>
      <Card hoverable className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {musician.bandName}
            </h3>
            <p className="text-sm text-text-muted flex items-center gap-1">
              <MapPin size={14} />
              {musician.location.city}, {musician.location.state}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-primary">
              <Star size={14} />
              <span className="text-sm font-medium">{Math.round(score)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {musician.genres.slice(0, 5).map((genre) => (
            <Badge key={genre} variant="default">
              {genre}
            </Badge>
          ))}
          {musician.genres.length > 5 && (
            <Badge variant="secondary">+{musician.genres.length - 5}</Badge>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>Profile completeness</span>
            <span>{musician.profileCompleteness}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${musician.profileCompleteness}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {matchReasons.map((reason) => (
            <span
              key={reason}
              className="text-xs text-success bg-success/10 rounded-full px-2 py-0.5"
            >
              {reason}
            </span>
          ))}
        </div>

        {linkEntries.length > 0 && (
          <div className="flex gap-2">
            {linkEntries.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Music size={12} />
                {platform}
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        )}

        <Button
          size="sm"
          className="w-full mt-1"
          onClick={() => setShowOfferForm(true)}
        >
          Send Offer
        </Button>
      </Card>

      {showOfferForm && (
        <OfferForm
          openDateId={openDateId}
          musicianId={musician._id}
          musicianName={musician.bandName}
          defaultDealType={openDateDealType}
          defaultAmount={openDateBudgetMin}
          onClose={() => setShowOfferForm(false)}
        />
      )}
    </>
  );
}
