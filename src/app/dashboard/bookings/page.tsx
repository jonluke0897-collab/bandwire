"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingCard } from "@/components/features/booking-card";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Upcoming", "Past", "Cancelled"] as const;

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Upcoming");
  const user = useQuery(api.users.me);
  const bookings = useQuery(api.bookings.listMine);

  if (bookings === undefined || !user) {
    return (
      <div className="max-w-content mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = bookings.filter((b) => {
    if (activeTab === "Upcoming")
      return b.status === "confirmed" && b.date >= today;
    if (activeTab === "Past")
      return b.status === "completed" || (b.status === "confirmed" && b.date < today);
    return b.status === "cancelled";
  });

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Bookings</h1>

      <div className="flex gap-1 mb-6 rounded-lg border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">
            {activeTab === "Upcoming"
              ? "No upcoming bookings. Your confirmed gigs will appear here."
              : `No ${activeTab.toLowerCase()} bookings.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              role={user.role as "venue" | "musician"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
