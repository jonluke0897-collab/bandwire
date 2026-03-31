"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEAL_TYPES } from "@/lib/constants";
import Link from "next/link";

const statusVariant: Record<string, "success" | "default" | "error"> = {
  confirmed: "success",
  completed: "default",
  cancelled: "error",
};

interface BookingCardProps {
  booking: {
    _id: string;
    venueName: string;
    musicianBandName: string;
    date: string;
    dealType: string;
    amount?: number;
    splitPercentage?: number;
    status: string;
  };
  role: "venue" | "musician";
}

export function BookingCard({ booking, role }: BookingCardProps) {
  const dealLabel =
    DEAL_TYPES.find((d) => d.value === booking.dealType)?.label ??
    booking.dealType;
  const displayDate = new Date(booking.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const displayName =
    role === "venue" ? booking.musicianBandName : booking.venueName;

  return (
    <Link href={`/dashboard/bookings/${booking._id}`}>
      <Card hoverable className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-text-primary">{displayName}</h3>
          <p className="text-sm text-text-muted">{displayDate}</p>
          <p className="text-xs text-text-muted mt-1">
            {dealLabel}
            {booking.amount ? ` — $${booking.amount}` : ""}
            {booking.splitPercentage ? ` — ${booking.splitPercentage}%` : ""}
          </p>
        </div>
        <Badge variant={statusVariant[booking.status] ?? "default"}>
          {booking.status}
        </Badge>
      </Card>
    </Link>
  );
}
