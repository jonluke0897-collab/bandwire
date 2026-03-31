"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { GENRES } from "@/lib/constants";
import { MapPin, Search, Users } from "lucide-react";
import Link from "next/link";
import { Doc } from "../../../../convex/_generated/dataModel";

export default function BrowsePage() {
  const user = useQuery(api.users.me);
  const [genres, setGenres] = useState<string[]>([]);
  const [city, setCity] = useState("");

  if (!user) return null;

  if (user.role === "venue") return <BrowseMusicians genres={genres} city={city} setGenres={setGenres} setCity={setCity} />;
  return <BrowseVenues genres={genres} city={city} setGenres={setGenres} setCity={setCity} />;
}

function FilterBar({
  genres,
  city,
  setGenres,
  setCity,
}: {
  genres: string[];
  city: string;
  setGenres: (g: string[]) => void;
  setCity: (c: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1">
        <MultiSelect
          options={GENRES}
          value={genres}
          onChange={setGenres}
          placeholder="Filter by genre..."
        />
      </div>
      <div className="sm:w-48">
        <Input
          placeholder="City..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
    </div>
  );
}

function BrowseMusicians({
  genres,
  city,
  setGenres,
  setCity,
}: {
  genres: string[];
  city: string;
  setGenres: (g: string[]) => void;
  setCity: (c: string) => void;
}) {
  const musicians = useQuery(api.musicians.browse, {
    genres: genres.length > 0 ? genres : undefined,
    city: city || undefined,
  });

  return (
    <div className="max-w-content mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Browse Musicians</h1>
      </div>
      <FilterBar genres={genres} city={city} setGenres={setGenres} setCity={setCity} />

      {musicians === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : musicians.length === 0 ? (
        <Card className="text-center py-12">
          <Search size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">No results found. Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {musicians.map((m: Doc<"musicians">) => (
            <Card key={m._id} hoverable className="flex flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{m.bandName}</h3>
                <p className="text-sm text-text-muted flex items-center gap-1">
                  <MapPin size={14} />{m.location.city}, {m.location.state}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.genres.slice(0, 4).map((g: string) => <Badge key={g}>{g}</Badge>)}
                {m.genres.length > 4 && <Badge variant="secondary">+{m.genres.length - 4}</Badge>}
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Profile</span>
                  <span>{m.profileCompleteness}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${m.profileCompleteness}%` }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BrowseVenues({
  genres,
  city,
  setGenres,
  setCity,
}: {
  genres: string[];
  city: string;
  setGenres: (g: string[]) => void;
  setCity: (c: string) => void;
}) {
  const venues = useQuery(api.venues.browse, {
    genres: genres.length > 0 ? genres : undefined,
    city: city || undefined,
  });

  return (
    <div className="max-w-content mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Browse Venues</h1>
      </div>
      <FilterBar genres={genres} city={city} setGenres={setGenres} setCity={setCity} />

      {venues === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : venues.length === 0 ? (
        <Card className="text-center py-12">
          <Search size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">No results found. Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v: Doc<"venues">) => (
            <Card key={v._id} hoverable className="flex flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{v.name}</h3>
                <p className="text-sm text-text-muted flex items-center gap-1">
                  <MapPin size={14} />{v.location.city}, {v.location.state}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {v.genres.slice(0, 4).map((g: string) => <Badge key={g}>{g}</Badge>)}
                {v.genres.length > 4 && <Badge variant="secondary">+{v.genres.length - 4}</Badge>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Capacity</span>
                <span className="text-text-primary">{v.capacity}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
