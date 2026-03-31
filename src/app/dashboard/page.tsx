"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-primary/10 p-3">
            <Calendar size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold">0</p>
            <p className="text-sm text-text-muted">Open Dates</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-warning/10 p-3">
            <Send size={24} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold">0</p>
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
    </div>
  );
}

function MusicianDashboard() {
  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-warning/10 p-3">
            <Send size={24} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold">0</p>
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
        <Card className="flex items-center gap-4">
          <div className="rounded-md bg-primary/10 p-3">
            <Calendar size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold">--%</p>
            <p className="text-sm text-text-muted">Profile Completeness</p>
          </div>
        </Card>
      </div>

      <Card className="text-center py-12">
        <h2 className="text-lg font-medium text-text-primary mb-2">
          You&apos;re all set!
        </h2>
        <p className="text-text-muted">
          When venues send offers, they&apos;ll appear here.
        </p>
      </Card>
    </div>
  );
}
