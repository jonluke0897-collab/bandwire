"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { GENRES, DEAL_TYPES } from "@/lib/constants";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Send,
  BookOpen,
  MapPin,
  Star,
  Music,
  Lock,
} from "lucide-react";

// --- Mock Data ---
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();
const pad = (n: number) => String(n).padStart(2, "0");

const MOCK_OPEN_DATES: Record<string, { status: string; genres: string[] }> = {
  [`${y}-${pad(m + 1)}-05`]: { status: "open", genres: ["Indie", "Rock"] },
  [`${y}-${pad(m + 1)}-12`]: { status: "hold", genres: ["Blues", "Jazz"] },
  [`${y}-${pad(m + 1)}-19`]: { status: "booked", genres: ["Punk", "Garage"] },
  [`${y}-${pad(m + 1)}-26`]: { status: "open", genres: ["Folk", "Americana"] },
};

const MOCK_MATCHES = [
  {
    id: "1",
    bandName: "The Velvet Echoes",
    city: "Austin",
    state: "TX",
    genres: ["Indie", "Rock", "Shoegaze"],
    profileCompleteness: 85,
    score: 165,
    matchReasons: ["2 shared genres", "Same city", "Complete profile"],
  },
  {
    id: "2",
    bandName: "Midnight Junction",
    city: "Dallas",
    state: "TX",
    genres: ["Blues", "Rock", "Americana"],
    profileCompleteness: 70,
    score: 114,
    matchReasons: ["2 shared genres"],
  },
  {
    id: "3",
    bandName: "Solar Flare Collective",
    city: "Austin",
    state: "TX",
    genres: ["Jazz", "Funk", "Experimental"],
    profileCompleteness: 90,
    score: 98,
    matchReasons: ["Same city", "Complete profile"],
  },
];

const MOCK_OFFERS = [
  { id: "1", band: "The Velvet Echoes", date: "Apr 5, 2026", dealType: "Flat Fee", amount: 250, status: "pending" },
  { id: "2", band: "Neon Drifters", date: "Mar 28, 2026", dealType: "Door Split", split: 70, status: "accepted" },
  { id: "3", band: "Glass Animals Tribute", date: "Mar 21, 2026", dealType: "Flat Fee", amount: 150, status: "declined" },
  { id: "4", band: "Rust & Ruin", date: "Apr 12, 2026", dealType: "Ticket Split", split: 60, status: "countered" },
];

const STATUS_DOT: Record<string, string> = {
  open: "bg-primary",
  hold: "bg-amber-500",
  booked: "bg-green-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OFFER_TABS = ["All", "Pending", "Accepted", "Declined", "Countered"];
const statusVariant: Record<string, "info" | "success" | "error" | "warning"> = {
  pending: "info",
  accepted: "success",
  declined: "error",
  countered: "warning",
};

// --- Page ---
export default function PreviewPage() {
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Offer form state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerTarget, setOfferTarget] = useState<string | null>(null);

  // Offer tabs
  const [activeTab, setActiveTab] = useState("All");

  // Open date form state
  const [formGenres, setFormGenres] = useState<string[]>(["Indie", "Rock"]);

  // Active section nav
  const [section, setSection] = useState<"dashboard" | "calendar" | "matches" | "offers">("dashboard");

  // Calendar computations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const filteredOffers =
    activeTab === "All"
      ? MOCK_OFFERS
      : MOCK_OFFERS.filter((o) => o.status === activeTab.toLowerCase());

  const handleDayClick = (dateStr: string) => {
    const existing = MOCK_OPEN_DATES[dateStr];
    if (existing) {
      setSection("matches");
    } else {
      const day = new Date(dateStr + "T12:00:00");
      if (isBefore(day, startOfDay(new Date()))) return;
      setSelectedDate(dateStr);
      setShowCreateModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Sidebar + header */}
      <div>
        <aside className="hidden md:flex md:flex-col md:w-sidebar md:fixed md:inset-y-0 bg-surface border-r border-border z-10">
          <div className="flex h-16 items-center px-6 border-b border-border">
            <span className="text-xl font-bold text-primary">Bandwire</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {([
              { key: "dashboard", label: "Dashboard", icon: Calendar },
              { key: "calendar", label: "Calendar", icon: Calendar },
              { key: "matches", label: "Matches", icon: Star },
              { key: "offers", label: "Offers", icon: Send },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  section === item.key
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="md:pl-sidebar">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface">
            <div className="md:hidden text-lg font-bold text-primary">Bandwire</div>
            <div className="hidden md:block" />
            <div className="flex items-center gap-3">
              <Badge variant="default">Preview Mode</Badge>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            {/* ---- DASHBOARD ---- */}
            {section === "dashboard" && (
              <div className="max-w-content mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Card className="flex items-center gap-4">
                    <div className="rounded-md bg-primary/10 p-3"><Calendar size={24} className="text-primary" /></div>
                    <div><p className="text-2xl font-semibold">4</p><p className="text-sm text-text-muted">Open Dates</p></div>
                  </Card>
                  <Card className="flex items-center gap-4">
                    <div className="rounded-md bg-warning/10 p-3"><Send size={24} className="text-warning" /></div>
                    <div><p className="text-2xl font-semibold">2</p><p className="text-sm text-text-muted">Pending Offers</p></div>
                  </Card>
                  <Card className="flex items-center gap-4">
                    <div className="rounded-md bg-success/10 p-3"><BookOpen size={24} className="text-success" /></div>
                    <div><p className="text-2xl font-semibold">1</p><p className="text-sm text-text-muted">Confirmed Bookings</p></div>
                  </Card>
                </div>

                <h2 className="text-lg font-medium mb-4">Upcoming Open Dates</h2>
                <div className="space-y-2">
                  {Object.entries(MOCK_OPEN_DATES).filter(([, od]) => od.status !== "cancelled").map(([date, od]) => {
                    const display = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                    const variant = od.status === "open" ? "info" : od.status === "hold" ? "warning" : "success";
                    return (
                      <Card key={date} hoverable className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{display}</p>
                          <p className="text-xs text-text-muted">{od.genres.join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={variant as "info"}>{od.status}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => setSection("matches")}>View Matches</Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---- CALENDAR ---- */}
            {section === "calendar" && (
              <div className="max-w-content mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Calendar</h1>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft size={20} /></Button>
                    <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight size={20} /></Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-text-muted py-2">{day}</div>
                    ))}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`pad-${i}`} />)}
                    {days.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const openDate = MOCK_OPEN_DATES[dateStr];
                      const isPast = isBefore(day, startOfDay(new Date()));
                      const today = isToday(day);
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          disabled={isPast && !openDate}
                          onClick={() => handleDayClick(dateStr)}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-md py-3 text-sm transition-colors",
                            isPast && !openDate ? "text-text-muted/50 cursor-default" : "hover:bg-surface-hover cursor-pointer",
                            today && "ring-1 ring-primary"
                          )}
                        >
                          {format(day, "d")}
                          {openDate && <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", STATUS_DOT[openDate.status])} />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-text-muted">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Open</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Hold</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Booked</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---- MATCHES ---- */}
            {section === "matches" && (
              <div className="max-w-content mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Matches</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left panel */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-medium text-text-muted mb-3">Open Dates</h2>
                    {Object.entries(MOCK_OPEN_DATES).filter(([, od]) => od.status !== "cancelled").map(([date, od], i) => {
                      const display = new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
                      const variant = od.status === "open" ? "info" : od.status === "hold" ? "warning" : "success";
                      return (
                        <div key={date} className={cn("w-full text-left rounded-lg border p-3 transition-colors", i === 0 ? "border-primary bg-primary/5" : "border-border bg-surface hover:bg-surface-hover")}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{display}</span>
                            <Badge variant={variant as "info"}>{od.status}</Badge>
                          </div>
                          <p className="text-xs text-text-muted mt-1">{od.genres.join(", ")}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Right panel */}
                  <div className="md:col-span-2 space-y-3">
                    <p className="text-sm text-text-muted">3 matches found</p>
                    {MOCK_MATCHES.map((match) => (
                      <Card key={match.id} hoverable className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{match.bandName}</h3>
                            <p className="text-sm text-text-muted flex items-center gap-1"><MapPin size={14} />{match.city}, {match.state}</p>
                          </div>
                          <div className="flex items-center gap-1 text-primary"><Star size={14} /><span className="text-sm font-medium">{match.score}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {match.genres.map((g) => <Badge key={g}>{g}</Badge>)}
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                            <span>Profile completeness</span><span>{match.profileCompleteness}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-hover">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${match.profileCompleteness}%` }} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {match.matchReasons.map((r) => <span key={r} className="text-xs text-success bg-success/10 rounded-full px-2 py-0.5">{r}</span>)}
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs text-text-muted flex items-center gap-1"><Music size={12} />spotify</span>
                        </div>
                        <Button size="sm" className="w-full mt-1" onClick={() => { setOfferTarget(match.bandName); setShowOfferModal(true); }}>Send Offer</Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---- OFFERS ---- */}
            {section === "offers" && (
              <div className="max-w-content mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Sent Offers</h1>
                <div className="flex gap-1 mb-6 rounded-lg border border-border bg-surface p-1">
                  {OFFER_TABS.map((tab) => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors", activeTab === tab ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text-primary")}>
                      {tab}
                    </button>
                  ))}
                </div>
                {filteredOffers.length === 0 ? (
                  <Card className="text-center py-12"><Send size={32} className="mx-auto text-text-muted mb-3" /><p className="text-text-muted">No {activeTab.toLowerCase()} offers</p></Card>
                ) : (
                  <div className="space-y-3">
                    {filteredOffers.map((offer) => (
                      <Card key={offer.id} hoverable className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{offer.band}</h3>
                          <p className="text-sm text-text-muted">{offer.date}</p>
                          <p className="text-xs text-text-muted mt-1">{offer.dealType}{offer.amount ? ` — $${offer.amount}` : ""}{offer.split ? ` — ${offer.split}%` : ""}</p>
                        </div>
                        <Badge variant={statusVariant[offer.status] ?? "default"}>{offer.status}</Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border flex">
        {([
          { key: "dashboard", label: "Home", icon: BookOpen },
          { key: "calendar", label: "Calendar", icon: Calendar },
          { key: "matches", label: "Matches", icon: Star },
          { key: "offers", label: "Offers", icon: Send },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={cn("flex-1 flex flex-col items-center gap-1 py-3 text-xs", section === item.key ? "text-primary" : "text-text-muted")}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Open Date Create Modal */}
      {showCreateModal && selectedDate && (
        <Modal open onClose={() => { setShowCreateModal(false); setSelectedDate(null); }} title="Post Open Date">
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-surface-hover px-3 py-2 text-sm">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <MultiSelect label="Genres *" options={GENRES} value={formGenres} onChange={setFormGenres} placeholder="Select genres..." />
            <Select label="Deal Type *" options={DEAL_TYPES} defaultValue="flat_fee" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Time" placeholder="8:00 PM" />
              <Input label="End Time" placeholder="11:00 PM" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Budget Min ($)" type="number" placeholder="100" />
              <Input label="Budget Max ($)" type="number" placeholder="300" />
            </div>
            <Textarea label="Notes" placeholder="Any details for musicians..." />
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => { setShowCreateModal(false); setSelectedDate(null); }}>Cancel</Button>
              <Button className="flex-1" onClick={() => { setShowCreateModal(false); setSelectedDate(null); }}>Post Open Date</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Offer Modal */}
      {showOfferModal && offerTarget && (
        <Modal open onClose={() => { setShowOfferModal(false); setOfferTarget(null); }} title="Send Offer">
          <p className="text-sm text-text-muted mb-4">Sending offer to <span className="text-text-primary font-medium">{offerTarget}</span></p>
          <p className="text-xs text-text-muted mb-4">2/5 free offers used this month</p>
          <div className="space-y-4">
            <Select label="Deal Type *" options={DEAL_TYPES} defaultValue="flat_fee" />
            <Input label="Amount ($)" type="number" placeholder="200" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Load-in Time" placeholder="5:00 PM" />
              <Input label="Set Length (min)" type="number" placeholder="45" />
            </div>
            <Textarea label="Notes" placeholder="Any additional details..." />
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => { setShowOfferModal(false); setOfferTarget(null); }}>Cancel</Button>
              <Button className="flex-1" onClick={() => { setShowOfferModal(false); setOfferTarget(null); }}>Send Offer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
