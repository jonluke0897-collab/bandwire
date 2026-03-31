"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { DEAL_TYPES } from "@/lib/constants";
import { MapPin, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

const statusVariant: Record<string, "info" | "success" | "error" | "warning" | "default"> = {
  pending: "info",
  accepted: "success",
  declined: "error",
  countered: "warning",
  expired: "default",
  withdrawn: "default",
};

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.offerId as Id<"offers">;

  const user = useQuery(api.users.me);
  const offer = useQuery(api.offers.getById, { offerId });

  const acceptOffer = useMutation(api.offers.accept);
  const declineOffer = useMutation(api.offers.decline);
  const counterOffer = useMutation(api.offers.counter);
  const acceptCounter = useMutation(api.offers.acceptCounter);

  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [counterForm, setCounterForm] = useState({
    dealType: "flat_fee",
    amount: "",
    splitPercentage: "",
    notes: "",
  });

  if (offer === undefined || user === undefined) {
    return (
      <div className="max-w-narrow mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="max-w-narrow mx-auto text-center py-12">
        <p className="text-text-muted">Offer not found.</p>
      </div>
    );
  }

  const isMusician = user?.role === "musician";
  const isVenue = user?.role === "venue";
  const dealLabel = DEAL_TYPES.find((d) => d.value === offer.dealType)?.label ?? offer.dealType;
  const displayDate = new Date(offer.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleAccept = async () => {
    try {
      const bookingId = await acceptOffer({ offerId });
      toast("Offer accepted! Booking confirmed.");
      router.push(`/dashboard/bookings/${bookingId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleDecline = async () => {
    try {
      await declineOffer({ offerId, reason: declineReason || undefined });
      toast("Offer declined.");
      setShowDecline(false);
      router.push("/dashboard/offers");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleCounter = async () => {
    try {
      await counterOffer({
        offerId,
        counterOffer: {
          dealType: counterForm.dealType as "flat_fee" | "door_split" | "ticket_split" | "bar_split" | "other",
          amount: counterForm.amount ? Number(counterForm.amount) : undefined,
          splitPercentage: counterForm.splitPercentage ? Number(counterForm.splitPercentage) : undefined,
          notes: counterForm.notes || undefined,
        },
      });
      toast("Counter-offer sent!");
      setShowCounter(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleAcceptCounter = async () => {
    try {
      const bookingId = await acceptCounter({ offerId });
      toast("Counter-offer accepted! Booking confirmed.");
      router.push(`/dashboard/bookings/${bookingId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-narrow mx-auto">
      <Link
        href="/dashboard/offers"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4"
      >
        <ArrowLeft size={16} /> Back to Offers
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Offer Details</h1>
        <Badge variant={statusVariant[offer.status] ?? "default"}>
          {offer.status}
        </Badge>
      </div>

      {/* Venue info */}
      <Card className="mb-4">
        <h2 className="text-sm font-medium text-text-muted mb-2">Venue</h2>
        <p className="font-semibold text-text-primary">{offer.venueName}</p>
        {offer.venueLocation && (
          <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
            <MapPin size={14} />
            {offer.venueLocation.city}, {offer.venueLocation.state}
          </p>
        )}
        {offer.venueCapacity && (
          <p className="text-xs text-text-muted mt-1">
            Capacity: {offer.venueCapacity}
          </p>
        )}
      </Card>

      {/* Musician info */}
      <Card className="mb-4">
        <h2 className="text-sm font-medium text-text-muted mb-2">Artist</h2>
        <p className="font-semibold text-text-primary">{offer.musicianBandName}</p>
        {offer.musicianLocation && (
          <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
            <MapPin size={14} />
            {offer.musicianLocation.city}, {offer.musicianLocation.state}
          </p>
        )}
      </Card>

      {/* Offer terms */}
      <Card className="mb-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">Offer Terms</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Date</span>
            <span className="flex items-center gap-1"><Calendar size={14} />{displayDate}</span>
          </div>
          {offer.startTime && (
            <div className="flex justify-between">
              <span className="text-text-muted">Start</span>
              <span>{offer.startTime}</span>
            </div>
          )}
          {offer.endTime && (
            <div className="flex justify-between">
              <span className="text-text-muted">End</span>
              <span>{offer.endTime}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">Deal Type</span>
            <span>{dealLabel}</span>
          </div>
          {offer.amount && (
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span>${offer.amount}</span>
            </div>
          )}
          {offer.splitPercentage && (
            <div className="flex justify-between">
              <span className="text-text-muted">Split</span>
              <span>{offer.splitPercentage}%</span>
            </div>
          )}
          {offer.notes && (
            <div className="pt-2 border-t border-border">
              <span className="text-text-muted">Notes</span>
              <p className="mt-1">{offer.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Counter-offer comparison */}
      {offer.status === "countered" && offer.counterOffer && (
        <Card className="mb-4 border-warning/30">
          <h2 className="text-sm font-medium text-warning mb-3">Counter-Offer</h2>
          <div className="space-y-2 text-sm">
            {offer.counterOffer.dealType && (
              <div className="flex justify-between">
                <span className="text-text-muted">Deal Type</span>
                <span>{DEAL_TYPES.find((d) => d.value === offer.counterOffer!.dealType)?.label}</span>
              </div>
            )}
            {offer.counterOffer.amount && (
              <div className="flex justify-between">
                <span className="text-text-muted">Amount</span>
                <span>${offer.counterOffer.amount}</span>
              </div>
            )}
            {offer.counterOffer.splitPercentage && (
              <div className="flex justify-between">
                <span className="text-text-muted">Split</span>
                <span>{offer.counterOffer.splitPercentage}%</span>
              </div>
            )}
            {offer.counterOffer.notes && (
              <div className="pt-2 border-t border-border">
                <span className="text-text-muted">Notes</span>
                <p className="mt-1">{offer.counterOffer.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      {isMusician && offer.status === "pending" && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleAccept}>Accept</Button>
          <Button variant="ghost" className="flex-1" onClick={() => {
            setShowCounter(true);
            setCounterForm({
              dealType: offer.dealType,
              amount: offer.amount?.toString() ?? "",
              splitPercentage: offer.splitPercentage?.toString() ?? "",
              notes: "",
            });
          }}>
            Counter
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setShowDecline(true)}>
            Decline
          </Button>
        </div>
      )}

      {isVenue && offer.status === "countered" && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleAcceptCounter}>
            Accept Counter-Offer
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setShowDecline(true)}>
            Decline
          </Button>
        </div>
      )}

      {/* Decline modal */}
      {showDecline && (
        <Modal open onClose={() => setShowDecline(false)} title="Decline Offer">
          <Textarea
            label="Reason (optional)"
            placeholder="Let them know why..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDecline(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleDecline}>Decline</Button>
          </div>
        </Modal>
      )}

      {/* Counter modal */}
      {showCounter && (
        <Modal open onClose={() => setShowCounter(false)} title="Send Counter-Offer">
          <div className="space-y-4">
            <Select
              label="Deal Type"
              options={DEAL_TYPES}
              value={counterForm.dealType}
              onChange={(e) => setCounterForm({ ...counterForm, dealType: e.target.value })}
            />
            {counterForm.dealType === "flat_fee" ? (
              <Input label="Amount ($)" type="number" value={counterForm.amount} onChange={(e) => setCounterForm({ ...counterForm, amount: e.target.value })} />
            ) : (
              <Input label="Split (%)" type="number" value={counterForm.splitPercentage} onChange={(e) => setCounterForm({ ...counterForm, splitPercentage: e.target.value })} />
            )}
            <Textarea label="Notes" value={counterForm.notes} onChange={(e) => setCounterForm({ ...counterForm, notes: e.target.value })} />
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowCounter(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCounter}>Send Counter</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
