"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Send, BookOpen } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const user = useQuery(api.users.me);

  if (!user) return null;

  if (user.role === "venue") {
    return <VenueDashboard />;
  }

  return <MusicianDashboard />;
}

function VenueDashboard() {
  const openDates = useQuery(api.openDates.listByVenue);
  const offers = useQuery(api.offers.listSent);
  const subStatus = useQuery(api.subscriptions.getStatus);

  const loading = openDates === undefined || offers === undefined;

  const openCount = openDates?.filter((od) => od.status === "open").length ?? 0;
  const pendingCount =
    offers?.filter((o) => o.status === "pending").length ?? 0;

  const upcomingDates = openDates
    ?.filter(
      (od) => od.status !== "cancelled" && od.date >= new Date().toISOString().split("T")[0]
    )
    .slice(0, 5);

  const statusBadge: Record<string, "info" | "warning" | "success"> = {
    open: "info",
    hold: "warning",
    booked: "success",
  };

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-primary/10 p-3">
            <Calendar size={24} className="text-primary" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className="text-2xl font-semibold">{openCount}</p>
            )}
            <p className="text-sm text-text-muted">Open Dates</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-warning/10 p-3">
            <Send size={24} className="text-warning" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className="text-2xl font-semibold">{pendingCount}</p>
            )}
            <p className="text-sm text-text-muted">Pending Offers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-success/10 p-3">
            <BookOpen size={24} className="text-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold">0</p>
            <p className="text-sm text-text-muted">Confirmed Bookings</p>
          </div>
        </Card>
      </div>

      {subStatus && subStatus.tier === "free" && subStatus.offersThisMonth > 3 && (
        <Card className="mb-6 border-warning/30 bg-warning/5 flex items-center justify-between">
          <p className="text-sm text-warning font-medium">
            You&apos;ve used {subStatus.offersThisMonth} of 5 free offers this month.
          </p>
          <Link href="/dashboard/settings">
            <Button size="sm">Upgrade to Pro</Button>
          </Link>
        </Card>
      )}

      {!loading && upcomingDates && upcomingDates.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium mb-4">Upcoming Open Dates</h2>
          <div className="space-y-2">
            {upcomingDates.map((od) => {
              const displayDate = new Date(
                od.date + "T12:00:00"
              ).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              return (
                <Card
                  key={od._id}
                  hoverable
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {displayDate}
                    </p>
                    <p className="text-xs text-text-muted">
                      {od.genres.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadge[od.status] ?? "default"}>
                      {od.status}
                    </Badge>
                    <Link href={`/dashboard/matches?date=${od.date}`}>
                      <Button variant="ghost" size="sm">
                        View Matches
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : !loading ? (
        <Card className="text-center py-12">
          <h2 className="text-lg font-medium text-text-primary mb-2">
            Welcome to Bandwire!
          </h2>
          <p className="text-text-muted mb-6">
            Start by posting an open date on your calendar.
          </p>
          <Link href="/dashboard/calendar">
            <Button>Go to Calendar</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

function MusicianDashboard() {
  const user = useQuery(api.users.me);
  const offers = useQuery(api.offers.listReceived);
  const bookings = useQuery(api.bookings.listMine);
  const musician = useQuery(
    api.musicians.getByUserId,
    user?._id ? { userId: user._id } : "skip"
  );

  const loading =
    offers === undefined || bookings === undefined || musician === undefined;

  const pendingCount =
    offers?.filter((o) => o.status === "pending").length ?? 0;
  const confirmedCount =
    bookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const completeness = musician?.profileCompleteness ?? 0;

  const recentPending = offers
    ?.filter((o) => o.status === "pending")
    .slice(0, 5);

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {!loading && completeness < 60 && (
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <p className="text-sm text-warning font-medium">
            Your profile is {completeness}% complete. Complete your profile to
            appear in venue matches.
          </p>
          <Link href="/dashboard/profile" className="mt-2 inline-block">
            <Button size="sm">Complete Profile</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-warning/10 p-3">
            <Send size={24} className="text-warning" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className="text-2xl font-semibold">{pendingCount}</p>
            )}
            <p className="text-sm text-text-muted">Pending Offers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-success/10 p-3">
            <BookOpen size={24} className="text-success" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className="text-2xl font-semibold">{confirmedCount}</p>
            )}
            <p className="text-sm text-text-muted">Confirmed Bookings</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-primary/10 p-3">
            <Calendar size={24} className="text-primary" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <p className="text-2xl font-semibold">{completeness}%</p>
            )}
            <p className="text-sm text-text-muted">Profile Completeness</p>
          </div>
        </Card>
      </div>

      {!loading && recentPending && recentPending.length > 0 ? (
        <div>
          <h2 className="text-lg font-medium mb-4">Pending Offers</h2>
          <div className="space-y-2">
            {recentPending.map((offer) => {
              const displayDate = new Date(
                offer.date + "T12:00:00"
              ).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <Card
                  key={offer._id}
                  hoverable
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {offer.venueName}
                    </p>
                    <p className="text-xs text-text-muted">{displayDate}</p>
                  </div>
                  <Link href={`/dashboard/offers/${offer._id}`}>
                    <Button variant="ghost" size="sm">
                      View Offer
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      ) : !loading ? (
        <Card className="text-center py-12">
          <h2 className="text-lg font-medium text-text-primary mb-2">
            You&apos;re all set!
          </h2>
          <p className="text-text-muted">
            When venues send offers, they&apos;ll appear here.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
