"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenDateForm } from "@/components/features/open-date-form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  open: "bg-primary",
  hold: "bg-amber-500",
  booked: "bg-green-500",
  cancelled: "bg-gray-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openDates = useQuery(api.openDates.listByVenue);

  const dateMap = useMemo(() => {
    const map = new Map<string, (typeof openDates extends (infer T)[] | undefined ? T : never)>();
    if (openDates) {
      for (const od of openDates) {
        map.set(od.date, od);
      }
    }
    return map;
  }, [openDates]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const handleDayClick = (dateStr: string) => {
    const existing = dateMap.get(dateStr);
    if (existing && existing.status !== "cancelled") {
      router.push(`/dashboard/matches?date=${dateStr}`);
    } else {
      const day = new Date(dateStr + "T12:00:00");
      if (isBefore(day, startOfDay(new Date()))) return;
      setSelectedDate(dateStr);
      setShowCreateModal(true);
    }
  };

  if (openDates === undefined) {
    return (
      <div className="max-w-content mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-content mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Calendar</h1>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <h2 className="text-lg font-medium text-text-primary">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-text-muted py-2"
            >
              {day}
            </div>
          ))}

          {paddingDays.map((i) => (
            <div key={`pad-${i}`} />
          ))}

          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const openDate = dateMap.get(dateStr);
            const isPast = isBefore(day, startOfDay(new Date()));
            const today = isToday(day);
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast && !openDate}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-md py-3 text-sm transition-colors",
                  inMonth ? "text-text-primary" : "text-text-muted",
                  isPast && !openDate
                    ? "text-text-muted/50 cursor-default"
                    : "hover:bg-surface-hover cursor-pointer",
                  today && "ring-1 ring-primary"
                )}
              >
                {format(day, "d")}
                {openDate && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                      STATUS_DOT[openDate.status] ?? "bg-gray-500"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Hold
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Booked
          </span>
        </div>
      </div>

      {showCreateModal && selectedDate && (
        <OpenDateForm
          date={selectedDate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}
