"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GENRES, US_STATES } from "@/lib/constants";
import { useState } from "react";

const musicianSchema = z.object({
  bandName: z.string().min(1, "Band/artist name is required"),
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
  displayName: z.string().min(1, "Your name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Only lowercase letters, numbers, hyphens, and underscores"
    ),
});

type MusicianFormData = z.infer<typeof musicianSchema>;

export function MusicianProfileForm() {
  const router = useRouter();
  const createUser = useMutation(api.users.create);
  const createMusician = useMutation(api.musicians.create);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MusicianFormData>({
    resolver: zodResolver(musicianSchema),
    defaultValues: {
      genres: [],
      state: "",
    },
  });

  const onSubmit = async (data: MusicianFormData) => {
    setSubmitting(true);
    try {
      await createUser({
        name: data.displayName,
        role: "musician",
        username: data.username,
      });

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

      await createMusician({
        bandName: data.bandName,
        genres: data.genres,
        location: { city: data.city, state: data.state },
        bio: data.bio || undefined,
        musicLinks:
          Object.keys(musicLinks).length > 0 ? musicLinks : undefined,
        socialLinks:
          Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        monthlyListeners: data.monthlyListeners
          ? Number(data.monthlyListeners)
          : undefined,
        avgDraw: data.avgDraw ? Number(data.avgDraw) : undefined,
      });

      toast("Musician profile created!");
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Your Name"
          placeholder="Marcus Johnson"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Input
          label="Username"
          placeholder="my-band"
          error={errors.username?.message}
          {...register("username")}
        />
      </div>

      <Input
        label="Band / Artist Name *"
        placeholder="The Electric Daisies"
        error={errors.bandName?.message}
        {...register("bandName")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City *"
          placeholder="Austin"
          error={errors.city?.message}
          {...register("city")}
        />
        <Select
          label="State *"
          options={US_STATES}
          placeholder="Select state"
          error={errors.state?.message}
          {...register("state")}
        />
      </div>

      <Controller
        name="genres"
        control={control}
        render={({ field }) => (
          <MultiSelect
            label="Genres *"
            options={GENRES}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select genres..."
            error={errors.genres?.message}
          />
        )}
      />

      <Textarea
        label="Bio"
        placeholder="Tell venues about your music, your story, and what makes your live show special..."
        error={errors.bio?.message}
        {...register("bio")}
      />

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">
          Music Links
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="https://open.spotify.com/artist/..."
            error={errors.spotify?.message}
            {...register("spotify")}
          />
          <Input
            placeholder="https://yourband.bandcamp.com"
            error={errors.bandcamp?.message}
            {...register("bandcamp")}
          />
          <Input
            placeholder="https://soundcloud.com/yourband"
            error={errors.soundcloud?.message}
            {...register("soundcloud")}
          />
          <Input
            placeholder="https://youtube.com/@yourband"
            error={errors.youtube?.message}
            {...register("youtube")}
          />
          <Input
            placeholder="https://music.apple.com/artist/..."
            error={errors.appleMusic?.message}
            {...register("appleMusic")}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">
          Social Links
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="https://instagram.com/yourband"
            error={errors.instagram?.message}
            {...register("instagram")}
          />
          <Input
            placeholder="https://facebook.com/yourband"
            error={errors.facebook?.message}
            {...register("facebook")}
          />
          <Input
            placeholder="https://twitter.com/yourband"
            error={errors.twitter?.message}
            {...register("twitter")}
          />
          <Input
            placeholder="https://yourband.com"
            error={errors.website?.message}
            {...register("website")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Monthly Listeners (Spotify)"
          type="number"
          placeholder="5000"
          error={errors.monthlyListeners?.message}
          {...register("monthlyListeners")}
        />
        <Input
          label="Average Draw (people per show)"
          type="number"
          placeholder="75"
          error={errors.avgDraw?.message}
          {...register("avgDraw")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating profile..." : "Create Musician Profile"}
      </Button>
    </form>
  );
}
