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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractView } from "@/components/features/contract-view";
import { toast } from "@/components/ui/toast";
import { DEAL_TYPES } from "@/lib/constants";
import { MapPin, Calendar, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as Id<"bookings">;

  const user = useQuery(api.users.me);
  const booking = useQuery(api.bookings.getById, { bookingId });
  const cancelBooking = useMutation(api.bookings.cancel);
  const acknowledgeContract = useMutation(api.bookings.acknowledgeContract);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (booking === undefined || user === undefined) {
    return (
      <div className="max-w-narrow mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-narrow mx-auto text-center py-12">
        <p className="text-text-muted">Booking not found.</p>
      </div>
    );
  }

  const isVenue = booking.venueUserId === user?._id;
  const dealLabel =
    DEAL_TYPES.find((d) => d.value === booking.dealType)?.label ??
    booking.dealType;
  const displayDate = new Date(booking.date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  const myAcknowledgment = isVenue
    ? booking.contractAcknowledgedByVenue
    : booking.contractAcknowledgedByMusician;

  const handleCancel = async () => {
    try {
      await cancelBooking({
        bookingId,
        reason: cancelReason || undefined,
      });
      toast("Booking cancelled.");
      router.push("/dashboard/bookings");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeContract({ bookingId });
      toast("Contract acknowledged!");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-narrow mx-auto">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4"
      >
        <ArrowLeft size={16} /> Back to Bookings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Booking Details</h1>
        <Badge
          variant={
            booking.status === "confirmed"
              ? "success"
              : booking.status === "cancelled"
                ? "error"
                : "default"
          }
        >
          {booking.status}
        </Badge>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card>
          <h2 className="text-sm font-medium text-text-muted mb-2">Venue</h2>
          <p className="font-semibold">{booking.venueName}</p>
          {booking.venueLocation && (
            <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {booking.venueLocation.city}, {booking.venueLocation.state}
            </p>
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-text-muted mb-2">Artist</h2>
          <p className="font-semibold">{booking.musicianBandName}</p>
          {booking.musicianLocation && (
            <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {booking.musicianLocation.city}, {booking.musicianLocation.state}
            </p>
          )}
        </Card>
      </div>

      {/* Terms */}
      <Card className="mb-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">
          Booking Terms
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Date</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {displayDate}
            </span>
          </div>
          {booking.startTime && (
            <div className="flex justify-between">
              <span className="text-text-muted">Start</span>
              <span>{booking.startTime}</span>
            </div>
          )}
          {booking.endTime && (
            <div className="flex justify-between">
              <span className="text-text-muted">End</span>
              <span>{booking.endTime}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-muted">Deal Type</span>
            <span>{dealLabel}</span>
          </div>
          {booking.amount && (
            <div className="flex justify-between">
              <span className="text-text-muted">Amount</span>
              <span>${booking.amount}</span>
            </div>
          )}
          {booking.splitPercentage && (
            <div className="flex justify-between">
              <span className="text-text-muted">Split</span>
              <span>{booking.splitPercentage}%</span>
            </div>
          )}
        </div>
      </Card>

      {/* Contract */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-3">Contract</h2>
        <ContractView contractText={booking.contractText} />
      </div>

      {/* Acknowledgments */}
      <Card className="mb-4">
        <h2 className="text-sm font-medium text-text-muted mb-3">
          Contract Acknowledgment
        </h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {booking.contractAcknowledgedByVenue ? (
              <Check size={16} className="text-success" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-border" />
            )}
            <span>Venue acknowledged</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {booking.contractAcknowledgedByMusician ? (
              <Check size={16} className="text-success" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-border" />
            )}
            <span>Artist acknowledged</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {booking.status === "confirmed" && (
        <div className="flex gap-3">
          {!myAcknowledgment && (
            <Button className="flex-1" onClick={handleAcknowledge}>
              Acknowledge Contract
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setShowCancel(true)}
          >
            Cancel Booking
          </Button>
        </div>
      )}

      {/* Cancel modal */}
      {showCancel && (
        <Modal
          open
          onClose={() => setShowCancel(false)}
          title="Cancel Booking"
        >
          <p className="text-sm text-text-muted mb-4">
            Are you sure you want to cancel this booking? This action cannot be
            undone.
          </p>
          <Textarea
            label="Reason (optional)"
            placeholder="Let the other party know why..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCancel(false)}
            >
              Keep Booking
            </Button>
            <Button className="flex-1" onClick={handleCancel}>
              Cancel Booking
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
