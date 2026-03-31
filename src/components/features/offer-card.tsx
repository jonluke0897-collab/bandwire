"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEAL_TYPES } from "@/lib/constants";

const statusVariant: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  pending: "info",
  accepted: "success",
  declined: "error",
  countered: "warning",
  expired: "secondary" as "info",
  withdrawn: "secondary" as "info",
};

interface OfferCardProps {
  offer: {
    _id: string;
    musicianBandName: string;
    date: string;
    dealType: string;
    amount?: number;
    splitPercentage?: number;
    status: string;
    createdAt: number;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  const dealLabel =
    DEAL_TYPES.find((d) => d.value === offer.dealType)?.label ?? offer.dealType;

  const displayDate = new Date(offer.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <Card hoverable className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-medium text-text-primary">
          {offer.musicianBandName}
        </h3>
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
    </Card>
  );
}
