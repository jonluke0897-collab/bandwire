"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GENRES, DEAL_TYPES } from "@/lib/constants";
import { useEffect, useState } from "react";

const schema = z.object({
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  dealType: z.enum([
    "flat_fee",
    "door_split",
    "ticket_split",
    "bar_split",
    "other",
  ]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface OpenDateFormProps {
  date: string;
  onClose: () => void;
}

export function OpenDateForm({ date, onClose }: OpenDateFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const createOpenDate = useMutation(api.openDates.create);

  const user = useQuery(api.users.me);
  const venue = useQuery(
    api.venues.getByUserId,
    user?._id ? { userId: user._id } : "skip"
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { genres: [], dealType: "flat_fee" },
  });

  useEffect(() => {
    if (venue) {
      reset({
        genres: venue.genres ?? [],
        dealType: venue.defaultDealType ?? "flat_fee",
        budgetMin: venue.defaultBudgetMin?.toString() ?? "",
        budgetMax: venue.defaultBudgetMax?.toString() ?? "",
      });
    }
  }, [venue, reset]);

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await createOpenDate({
        date,
        genres: data.genres,
        dealType: data.dealType,
        budgetMin: data.budgetMin ? Number(data.budgetMin) : undefined,
        budgetMax: data.budgetMax ? Number(data.budgetMax) : undefined,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        notes: data.notes || undefined,
      });
      toast("Open date created!");
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Post Open Date">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-md border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary">
          {displayDate}
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

        <Select
          label="Deal Type *"
          options={DEAL_TYPES}
          error={errors.dealType?.message}
          {...register("dealType")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time"
            placeholder="8:00 PM"
            {...register("startTime")}
          />
          <Input
            label="End Time"
            placeholder="11:00 PM"
            {...register("endTime")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Budget Min ($)"
            type="number"
            placeholder="100"
            {...register("budgetMin")}
          />
          <Input
            label="Budget Max ($)"
            type="number"
            placeholder="300"
            {...register("budgetMax")}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Any details for musicians..."
          {...register("notes")}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Posting..." : "Post Open Date"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
