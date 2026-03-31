"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { DEAL_TYPES } from "@/lib/constants";
import { useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  dealType: z.enum([
    "flat_fee",
    "door_split",
    "ticket_split",
    "bar_split",
    "other",
  ]),
  amount: z.string().optional(),
  splitPercentage: z.string().optional(),
  loadInTime: z.string().optional(),
  setLength: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface OfferFormProps {
  openDateId: Id<"openDates">;
  musicianId: Id<"musicians">;
  musicianName: string;
  defaultDealType: string;
  defaultAmount?: number;
  onClose: () => void;
}

export function OfferForm({
  openDateId,
  musicianId,
  musicianName,
  defaultDealType,
  defaultAmount,
  onClose,
}: OfferFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const sendOffer = useMutation(api.offers.send);

  const user = useQuery(api.users.me);
  const offerCount = useQuery(api.offers.countSentThisMonth);

  const isFree = user?.subscriptionTier === "free";
  const limitReached = isFree && offerCount !== undefined && offerCount >= 5;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dealType: defaultDealType as FormData["dealType"],
      amount: defaultAmount?.toString() ?? "",
    },
  });

  const dealType = watch("dealType");
  const showAmount = dealType === "flat_fee";
  const showSplit = ["door_split", "ticket_split", "bar_split"].includes(
    dealType
  );

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await sendOffer({
        openDateId,
        musicianId,
        dealType: data.dealType,
        amount: data.amount ? Number(data.amount) : undefined,
        splitPercentage: data.splitPercentage
          ? Number(data.splitPercentage)
          : undefined,
        loadInTime: data.loadInTime || undefined,
        setLength: data.setLength ? Number(data.setLength) : undefined,
        notes: data.notes || undefined,
      });
      toast("Offer sent!");
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (limitReached) {
    return (
      <Modal open onClose={onClose} title="Send Offer">
        <Card className="text-center py-8">
          <Lock size={32} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Free Tier Limit Reached
          </h3>
          <p className="text-text-muted mb-4 text-sm">
            You&apos;ve sent {offerCount} of 5 offers this month.
            Upgrade to Pro for unlimited offers.
          </p>
          <Link href="/dashboard/settings">
            <Button>Upgrade to Pro</Button>
          </Link>
        </Card>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Send Offer">
      <p className="text-sm text-text-muted mb-4">
        Sending offer to <span className="text-text-primary font-medium">{musicianName}</span>
      </p>
      {isFree && offerCount !== undefined && (
        <p className="text-xs text-text-muted mb-4">
          {offerCount}/5 free offers used this month
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Deal Type *"
          options={DEAL_TYPES}
          error={errors.dealType?.message}
          {...register("dealType")}
        />

        {showAmount && (
          <Input
            label="Amount ($)"
            type="number"
            placeholder="200"
            {...register("amount")}
          />
        )}

        {showSplit && (
          <Input
            label="Split Percentage (%)"
            type="number"
            placeholder="70"
            {...register("splitPercentage")}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Load-in Time"
            placeholder="5:00 PM"
            {...register("loadInTime")}
          />
          <Input
            label="Set Length (min)"
            type="number"
            placeholder="45"
            {...register("setLength")}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Any additional details..."
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
            {submitting ? "Sending..." : "Send Offer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
