"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { toast } from "@/components/ui/toast";
import { GENRES, DEAL_TYPES, US_STATES } from "@/lib/constants";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const user = useQuery(api.users.me);
  if (!user) return null;
  if (user.role === "venue") return <VenueProfile userId={user._id} userName={user.name} />;
  return <MusicianProfile userId={user._id} userName={user.name} />;
}

// --- Venue Profile ---
const venueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  capacity: z.string().min(1, "Capacity is required"),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  defaultDealType: z.enum(["flat_fee", "door_split", "ticket_split", "bar_split", "other"]),
  defaultBudgetMin: z.string().optional(),
  defaultBudgetMax: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  displayName: z.string().min(1, "Name is required"),
});

function VenueProfile({ userId, userName }: { userId: string; userName: string }) {
  const venue = useQuery(api.venues.getByUserId, { userId: userId as any });
  const updateVenue = useMutation(api.venues.update);
  const updateUser = useMutation(api.users.update);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(venueSchema),
    defaultValues: { genres: [] as string[], defaultDealType: "flat_fee" as const, displayName: userName },
  });

  useEffect(() => {
    if (venue) {
      reset({
        name: venue.name,
        city: venue.location.city,
        state: venue.location.state,
        address: venue.location.address ?? "",
        capacity: venue.capacity.toString(),
        genres: venue.genres,
        defaultDealType: venue.defaultDealType,
        defaultBudgetMin: venue.defaultBudgetMin?.toString() ?? "",
        defaultBudgetMax: venue.defaultBudgetMax?.toString() ?? "",
        website: venue.website ?? "",
        description: venue.description ?? "",
        displayName: userName,
      });
      setPhotos(venue.photoUrls ?? []);
    }
  }, [venue, userName, reset]);

  if (!venue) return <Skeleton className="h-96 max-w-narrow mx-auto" />;

  const onSubmit = async (data: z.infer<typeof venueSchema>) => {
    setSubmitting(true);
    try {
      await updateVenue({
        name: data.name,
        location: { city: data.city, state: data.state, address: data.address || undefined },
        capacity: Number(data.capacity),
        genres: data.genres,
        defaultDealType: data.defaultDealType,
        defaultBudgetMin: data.defaultBudgetMin ? Number(data.defaultBudgetMin) : undefined,
        defaultBudgetMax: data.defaultBudgetMax ? Number(data.defaultBudgetMax) : undefined,
        website: data.website || undefined,
        description: data.description || undefined,
      });
      if (data.displayName !== userName) {
        await updateUser({ name: data.displayName });
      }
      toast("Profile updated!");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-narrow mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
      <Card className="mb-6">
        <p className="text-sm text-text-muted">Username: <span className="text-text-primary font-mono">@{venue ? "" : ""}</span></p>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input label="Your Name" error={errors.displayName?.message} {...register("displayName")} />
        <Input label="Venue Name *" error={errors.name?.message} {...register("name")} />
        <Textarea label="Description" placeholder="Tell musicians about your venue..." {...register("description")} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="City *" error={errors.city?.message} {...register("city")} />
          <Select label="State *" options={US_STATES} error={errors.state?.message} {...register("state")} />
          <Input label="Capacity *" type="number" error={errors.capacity?.message} {...register("capacity")} />
        </div>

        <Input label="Address" {...register("address")} />

        <Controller
          name="genres"
          control={control}
          render={({ field }) => (
            <MultiSelect label="Preferred Genres *" options={GENRES} value={field.value} onChange={field.onChange} error={errors.genres?.message} />
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Default Deal Type *" options={DEAL_TYPES} error={errors.defaultDealType?.message} {...register("defaultDealType")} />
          <Input label="Budget Min ($)" type="number" {...register("defaultBudgetMin")} />
          <Input label="Budget Max ($)" type="number" {...register("defaultBudgetMax")} />
        </div>

        <Input label="Website" placeholder="https://..." {...register("website")} />

        <div>
          <label className="text-sm font-medium text-text-primary mb-2 block">Venue Photos</label>
          <PhotoUpload value={photos} onChange={setPhotos} max={5} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

// --- Musician Profile ---
const musicianSchema = z.object({
  bandName: z.string().min(1, "Band name is required"),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  bio: z.string().optional(),
  spotify: z.string().optional(),
  bandcamp: z.string().optional(),
  soundcloud: z.string().optional(),
  youtube: z.string().optional(),
  appleMusic: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  website: z.string().optional(),
  monthlyListeners: z.string().optional(),
  avgDraw: z.string().optional(),
  displayName: z.string().min(1, "Name is required"),
});

function MusicianProfile({ userId, userName }: { userId: string; userName: string }) {
  const musician = useQuery(api.musicians.getByUserId, { userId: userId as any });
  const updateMusician = useMutation(api.musicians.update);
  const updateUser = useMutation(api.users.update);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(musicianSchema),
    defaultValues: { genres: [] as string[], displayName: userName },
  });

  useEffect(() => {
    if (musician) {
      reset({
        bandName: musician.bandName,
        genres: musician.genres,
        city: musician.location.city,
        state: musician.location.state,
        bio: musician.bio ?? "",
        spotify: musician.musicLinks?.spotify ?? "",
        bandcamp: musician.musicLinks?.bandcamp ?? "",
        soundcloud: musician.musicLinks?.soundcloud ?? "",
        youtube: musician.musicLinks?.youtube ?? "",
        appleMusic: musician.musicLinks?.appleMusic ?? "",
        instagram: musician.socialLinks?.instagram ?? "",
        facebook: musician.socialLinks?.facebook ?? "",
        twitter: musician.socialLinks?.twitter ?? "",
        website: musician.socialLinks?.website ?? "",
        monthlyListeners: musician.monthlyListeners?.toString() ?? "",
        avgDraw: musician.avgDraw?.toString() ?? "",
        displayName: userName,
      });
      setPhotos(musician.photoUrls ?? []);
    }
  }, [musician, userName, reset]);

  if (!musician) return <Skeleton className="h-96 max-w-narrow mx-auto" />;

  const onSubmit = async (data: z.infer<typeof musicianSchema>) => {
    setSubmitting(true);
    try {
      const musicLinks: Record<string, string | undefined> = {};
      if (data.spotify) musicLinks.spotify = data.spotify;
      if (data.bandcamp) musicLinks.bandcamp = data.bandcamp;
      if (data.soundcloud) musicLinks.soundcloud = data.soundcloud;
      if (data.youtube) musicLinks.youtube = data.youtube;
      if (data.appleMusic) musicLinks.appleMusic = data.appleMusic;

      const socialLinks: Record<string, string | undefined> = {};
      if (data.instagram) socialLinks.instagram = data.instagram;
      if (data.facebook) socialLinks.facebook = data.facebook;
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.website) socialLinks.website = data.website;

      await updateMusician({
        bandName: data.bandName,
        genres: data.genres,
        location: { city: data.city, state: data.state },
        bio: data.bio || undefined,
        musicLinks: Object.keys(musicLinks).length > 0 ? musicLinks as any : undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks as any : undefined,
        monthlyListeners: data.monthlyListeners ? Number(data.monthlyListeners) : undefined,
        avgDraw: data.avgDraw ? Number(data.avgDraw) : undefined,
      });
      if (data.displayName !== userName) {
        await updateUser({ name: data.displayName });
      }
      toast("Profile updated!");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const suggestions: string[] = [];
  if (!musician.bio) suggestions.push("Add a bio");
  if (!musician.musicLinks?.spotify && !musician.musicLinks?.bandcamp) suggestions.push("Add a music link");
  if (!musician.monthlyListeners) suggestions.push("Add monthly listeners");
  if (!musician.avgDraw) suggestions.push("Add average draw");

  return (
    <div className="max-w-narrow mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      {/* Profile completeness */}
      <Card className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-muted">Profile Completeness</span>
          <span className="text-text-primary font-medium">{musician.profileCompleteness}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-hover">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${musician.profileCompleteness}%` }} />
        </div>
        {suggestions.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            To improve: {suggestions.join(" · ")}
          </p>
        )}
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input label="Your Name" error={errors.displayName?.message} {...register("displayName")} />
        <Input label="Band Name *" error={errors.bandName?.message} {...register("bandName")} />
        <Textarea label="Bio" placeholder="Tell venues about your music..." {...register("bio")} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="City *" error={errors.city?.message} {...register("city")} />
          <Select label="State *" options={US_STATES} error={errors.state?.message} {...register("state")} />
        </div>

        <Controller
          name="genres"
          control={control}
          render={({ field }) => (
            <MultiSelect label="Genres *" options={GENRES} value={field.value} onChange={field.onChange} error={errors.genres?.message} />
          )}
        />

        <h3 className="text-sm font-medium text-text-muted pt-2">Music Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Spotify" placeholder="https://open.spotify.com/..." {...register("spotify")} />
          <Input label="Bandcamp" placeholder="https://yourband.bandcamp.com" {...register("bandcamp")} />
          <Input label="SoundCloud" placeholder="https://soundcloud.com/..." {...register("soundcloud")} />
          <Input label="YouTube" placeholder="https://youtube.com/..." {...register("youtube")} />
          <Input label="Apple Music" placeholder="https://music.apple.com/..." {...register("appleMusic")} />
        </div>

        <h3 className="text-sm font-medium text-text-muted pt-2">Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Instagram" placeholder="https://instagram.com/..." {...register("instagram")} />
          <Input label="Facebook" placeholder="https://facebook.com/..." {...register("facebook")} />
          <Input label="Twitter" placeholder="https://twitter.com/..." {...register("twitter")} />
          <Input label="Website" placeholder="https://..." {...register("website")} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Monthly Listeners" type="number" {...register("monthlyListeners")} />
          <Input label="Average Draw" type="number" {...register("avgDraw")} />
        </div>

        <div>
          <label className="text-sm font-medium text-text-primary mb-2 block">Band Photos</label>
          <PhotoUpload value={photos} onChange={setPhotos} max={5} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
