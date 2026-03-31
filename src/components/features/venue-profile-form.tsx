"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GENRES, DEAL_TYPES, US_STATES } from "@/lib/constants";
import { useState } from "react";

const venueSchema = z.object({
  venueName: z.string().min(1, "Venue name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  capacity: z.string().min(1, "Capacity is required"),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  defaultDealType: z.enum([
    "flat_fee",
    "door_split",
    "ticket_split",
    "bar_split",
    "other",
  ]),
  defaultBudgetMin: z.string().optional(),
  defaultBudgetMax: z.string().optional(),
  website: z.string().optional(),
  displayName: z.string().min(1, "Your name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Only lowercase letters, numbers, hyphens, and underscores"
    ),
});

type VenueFormData = z.infer<typeof venueSchema>;

export function VenueProfileForm() {
  const router = useRouter();
  const createUser = useMutation(api.users.create);
  const createVenue = useMutation(api.venues.create);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VenueFormData>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      genres: [],
      defaultDealType: "flat_fee",
      state: "",
    },
  });

  const onSubmit = async (data: VenueFormData) => {
    setSubmitting(true);
    try {
      await createUser({
        name: data.displayName,
        role: "venue",
        username: data.username,
      });

      await createVenue({
        name: data.venueName,
        location: {
          city: data.city,
          state: data.state,
          address: data.address || undefined,
        },
        capacity: Number(data.capacity),
        genres: data.genres,
        defaultDealType: data.defaultDealType,
        defaultBudgetMin: data.defaultBudgetMin
          ? Number(data.defaultBudgetMin)
          : undefined,
        defaultBudgetMax: data.defaultBudgetMax
          ? Number(data.defaultBudgetMax)
          : undefined,
        website: data.website || undefined,
      });

      toast("Venue profile created!");
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
          placeholder="Jon Lu"
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Input
          label="Username"
          placeholder="my-venue"
          error={errors.username?.message}
          {...register("username")}
        />
      </div>

      <Input
        label="Venue Name *"
        placeholder="The Blue Note"
        error={errors.venueName?.message}
        {...register("venueName")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <Input
          label="Capacity *"
          type="number"
          placeholder="200"
          error={errors.capacity?.message}
          {...register("capacity")}
        />
      </div>

      <Input
        label="Address"
        placeholder="123 Main St"
        error={errors.address?.message}
        {...register("address")}
      />

      <Controller
        name="genres"
        control={control}
        render={({ field }) => (
          <MultiSelect
            label="Preferred Genres *"
            options={GENRES}
            value={field.value}
            onChange={field.onChange}
            placeholder="Select genres..."
            error={errors.genres?.message}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Default Deal Type *"
          options={DEAL_TYPES}
          error={errors.defaultDealType?.message}
          {...register("defaultDealType")}
        />
        <Input
          label="Budget Min ($)"
          type="number"
          placeholder="100"
          error={errors.defaultBudgetMin?.message}
          {...register("defaultBudgetMin")}
        />
        <Input
          label="Budget Max ($)"
          type="number"
          placeholder="500"
          error={errors.defaultBudgetMax?.message}
          {...register("defaultBudgetMax")}
        />
      </div>

      <Input
        label="Website"
        placeholder="https://myvenuesite.com"
        error={errors.website?.message}
        {...register("website")}
      />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating profile..." : "Create Venue Profile"}
      </Button>
    </form>
  );
}
