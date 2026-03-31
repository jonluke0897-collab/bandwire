"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEAL_TYPES } from "@/lib/constants";
import Link from "next/link";

const statusVariant: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  pending: "info",
  accepted: "success",
  declined: "error",
  countered: "warning",
  expired: "default",
  withdrawn: "default",
};

interface OfferCardProps {
  offer: {
    _id: string;
    musicianBandName?: string;
    venueName?: string;
    date: string;
    dealType: string;
    amount?: number;
    splitPercentage?: number;
    status: string;
    createdAt: number;
  };
  role: "venue" | "musician";
  onAccept?: () => void;
  onDecline?: () => void;
  onCounter?: () => void;
}

export function OfferCard({ offer, role, onAccept, onDecline, onCounter }: OfferCardProps) {
  const dealLabel =
    DEAL_TYPES.find((d) => d.value === offer.dealType)?.label ?? offer.dealType;

  const displayDate = new Date(offer.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  const displayName =
    role === "venue" ? offer.musicianBandName : offer.venueName;

  return (
    <Card hoverable className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Link
            href={`/dashboard/offers/${offer._id}`}
            className="font-medium text-text-primary hover:text-primary transition-colors"
          >
            {displayName ?? "Unknown"}
          </Link>
          <p className="text-sm text-text-muted">{displayDate}</p>
          <p className="text-xs text-text-muted mt-1">
            {dealLabel}
            {offer.amount ? ` — $${offer.amount}` : ""}
            {offer.splitPercentage ? ` — ${offer.splitPercentage}%` : ""}
          </p>
        </div>
        <Badge variant={statusVariant[offer.status] ?? "default"}>
          {offer.status}
        </Badge>
      </div>
      {role === "musician" && offer.status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={onAccept}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={onCounter}>
            Counter
          </Button>
          <Button size="sm" variant="ghost" onClick={onDecline}>
            Decline
          </Button>
        </div>
      )}
    </Card>
  );
}
