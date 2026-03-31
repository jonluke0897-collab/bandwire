"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Music, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const user = useQuery(api.users.getByUsername, { username });

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <div className="max-w-narrow mx-auto px-6 py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Profile Not Found</h1>
          <p className="text-text-muted mb-4">No user with username &quot;{username}&quot; exists.</p>
          <Link href="/" className="text-primary hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  if (user.role === "musician") return <MusicianPublicProfile userId={user._id} userName={user.name} />;
  if (user.role === "venue") return <VenuePublicProfile userId={user._id} userName={user.name} />;

  return null;
}

function MusicianPublicProfile({ userId, userName }: { userId: Id<"users">; userName: string }) {
  const musician = useQuery(api.musicians.getByUserId, { userId });

  if (musician === undefined) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <div className="max-w-narrow mx-auto px-6 py-12">
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!musician) return null;

  const musicLinks = musician.musicLinks
    ? Object.entries(musician.musicLinks as Record<string, string | undefined>).filter(([, url]: [string, string | undefined]) => url && url.length > 0) as [string, string][]
    : [];
  const socialLinks = musician.socialLinks
    ? Object.entries(musician.socialLinks as Record<string, string | undefined>).filter(([, url]: [string, string | undefined]) => url && url.length > 0) as [string, string][]
    : [];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-narrow mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-text-muted hover:text-primary mb-6 inline-block">
          &larr; Bandwire
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{musician.bandName}</h1>
          <p className="text-text-muted flex items-center gap-1">
            <MapPin size={16} />{musician.location.city}, {musician.location.state}
          </p>
          {musician.memberCount && (
            <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
              <Users size={14} />{musician.memberCount} members
            </p>
          )}
        </div>

        {/* Photos */}
        {musician.photoUrls && musician.photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {musician.photoUrls.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`${musician.bandName} photo ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Bio */}
        {musician.bio && (
          <Card className="mb-6">
            <p className="text-sm leading-relaxed">{musician.bio}</p>
          </Card>
        )}

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-6">
          {musician.genres.map((g) => <Badge key={g}>{g}</Badge>)}
        </div>

        {/* Stats */}
        {(musician.monthlyListeners || musician.avgDraw) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {musician.monthlyListeners && (
              <Card>
                <p className="text-2xl font-semibold">{musician.monthlyListeners.toLocaleString()}</p>
                <p className="text-sm text-text-muted">Monthly Listeners</p>
              </Card>
            )}
            {musician.avgDraw && (
              <Card>
                <p className="text-2xl font-semibold">{musician.avgDraw}</p>
                <p className="text-sm text-text-muted">Avg Draw</p>
              </Card>
            )}
          </div>
        )}

        {/* Music Links */}
        {musicLinks.length > 0 && (
          <Card className="mb-4">
            <h2 className="text-sm font-medium text-text-muted mb-3">Listen</h2>
            <div className="flex flex-wrap gap-3">
              {musicLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Music size={14} />{platform}<ExternalLink size={12} />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <Card>
            <h2 className="text-sm font-medium text-text-muted mb-3">Connect</h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe size={14} />{platform}<ExternalLink size={12} />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function VenuePublicProfile({ userId, userName }: { userId: Id<"users">; userName: string }) {
  const venue = useQuery(api.venues.getByUserId, { userId });

  if (venue === undefined) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <div className="max-w-narrow mx-auto px-6 py-12">
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!venue) return null;

  const socialLinks = venue.socialLinks
    ? Object.entries(venue.socialLinks as Record<string, string | undefined>).filter(([, url]: [string, string | undefined]) => url && url.length > 0) as [string, string][]
    : [];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-narrow mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-text-muted hover:text-primary mb-6 inline-block">
          &larr; Bandwire
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{venue.name}</h1>
          <p className="text-text-muted flex items-center gap-1">
            <MapPin size={16} />
            {venue.location.address ? `${venue.location.address}, ` : ""}
            {venue.location.city}, {venue.location.state}
          </p>
          <p className="text-sm text-text-muted mt-1">Capacity: {venue.capacity}</p>
        </div>

        {/* Photos */}
        {venue.photoUrls && venue.photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {venue.photoUrls.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
                <img src={url} alt={`${venue.name} photo ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {venue.description && (
          <Card className="mb-6">
            <p className="text-sm leading-relaxed">{venue.description}</p>
          </Card>
        )}

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-6">
          {venue.genres.map((g) => <Badge key={g}>{g}</Badge>)}
        </div>

        {/* Website & Social */}
        {(venue.website || socialLinks.length > 0) && (
          <Card>
            <h2 className="text-sm font-medium text-text-muted mb-3">Links</h2>
            <div className="flex flex-wrap gap-3">
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe size={14} />Website<ExternalLink size={12} />
                </a>
              )}
              {socialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe size={14} />{platform}<ExternalLink size={12} />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
