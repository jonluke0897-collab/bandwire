"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/features/offer-card";
import { toast } from "@/components/ui/toast";
import { DEAL_TYPES } from "@/lib/constants";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const VENUE_TABS = ["All", "Pending", "Accepted", "Declined", "Countered"] as const;
const MUSICIAN_TABS = ["Pending", "Accepted", "Declined"] as const;

export default function OffersPage() {
  const user = useQuery(api.users.me);

  if (!user) return null;

  if (user.role === "venue") return <VenueOffers />;
  return <MusicianOffers />;
}

function VenueOffers() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const offers = useQuery(api.offers.listSent);

  if (offers === undefined) return <OffersLoading />;

  const filtered =
    activeTab === "All"
      ? offers
      : offers.filter((o) => o.status === activeTab.toLowerCase());

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Sent Offers</h1>
      <TabBar tabs={VENUE_TABS} active={activeTab} onChange={setActiveTab} />
      {filtered.length === 0 ? (
        <EmptyOffers tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <OfferCard key={offer._id} offer={offer} role="venue" />
          ))}
        </div>
      )}
    </div>
  );
}

function MusicianOffers() {
  const [activeTab, setActiveTab] = useState<string>("Pending");
  const offers = useQuery(api.offers.listReceived);
  const acceptOffer = useMutation(api.offers.accept);
  const declineOffer = useMutation(api.offers.decline);
  const counterOffer = useMutation(api.offers.counter);

  const [declineTarget, setDeclineTarget] = useState<Id<"offers"> | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [counterTarget, setCounterTarget] = useState<Id<"offers"> | null>(null);
  const [counterForm, setCounterForm] = useState({
    dealType: "flat_fee",
    amount: "",
    splitPercentage: "",
    notes: "",
  });

  if (offers === undefined) return <OffersLoading />;

  const filtered = offers.filter((o) => o.status === activeTab.toLowerCase());

  const handleAccept = async (offerId: Id<"offers">) => {
    try {
      await acceptOffer({ offerId });
      toast("Offer accepted! Booking confirmed.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    try {
      await declineOffer({
        offerId: declineTarget,
        reason: declineReason || undefined,
      });
      toast("Offer declined.");
      setDeclineTarget(null);
      setDeclineReason("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleCounter = async () => {
    if (!counterTarget) return;
    try {
      await counterOffer({
        offerId: counterTarget,
        counterOffer: {
          dealType: counterForm.dealType as "flat_fee" | "door_split" | "ticket_split" | "bar_split" | "other",
          amount: counterForm.amount ? Number(counterForm.amount) : undefined,
          splitPercentage: counterForm.splitPercentage
            ? Number(counterForm.splitPercentage)
            : undefined,
          notes: counterForm.notes || undefined,
        },
      });
      toast("Counter-offer sent!");
      setCounterTarget(null);
      setCounterForm({ dealType: "flat_fee", amount: "", splitPercentage: "", notes: "" });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Received Offers</h1>
      <TabBar tabs={MUSICIAN_TABS} active={activeTab} onChange={setActiveTab} />
      {filtered.length === 0 ? (
        <EmptyOffers tab={activeTab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <OfferCard
              key={offer._id}
              offer={offer}
              role="musician"
              onAccept={() => handleAccept(offer._id)}
              onDecline={() => setDeclineTarget(offer._id)}
              onCounter={() => {
                setCounterTarget(offer._id);
                setCounterForm({
                  dealType: offer.dealType,
                  amount: offer.amount?.toString() ?? "",
                  splitPercentage: offer.splitPercentage?.toString() ?? "",
                  notes: "",
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Decline modal */}
      {declineTarget && (
        <Modal
          open
          onClose={() => {
            setDeclineTarget(null);
            setDeclineReason("");
          }}
          title="Decline Offer"
        >
          <p className="text-sm text-text-muted mb-4">
            Are you sure you want to decline this offer?
          </p>
          <Textarea
            label="Reason (optional)"
            placeholder="Let the venue know why..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setDeclineTarget(null);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleDecline}>
              Decline Offer
            </Button>
          </div>
        </Modal>
      )}

      {/* Counter modal */}
      {counterTarget && (
        <Modal
          open
          onClose={() => setCounterTarget(null)}
          title="Send Counter-Offer"
        >
          <div className="space-y-4">
            <Select
              label="Deal Type"
              options={DEAL_TYPES}
              value={counterForm.dealType}
              onChange={(e) =>
                setCounterForm({ ...counterForm, dealType: e.target.value })
              }
            />
            {counterForm.dealType === "flat_fee" ? (
              <Input
                label="Amount ($)"
                type="number"
                placeholder="200"
                value={counterForm.amount}
                onChange={(e) =>
                  setCounterForm({ ...counterForm, amount: e.target.value })
                }
              />
            ) : (
              <Input
                label="Split Percentage (%)"
                type="number"
                placeholder="70"
                value={counterForm.splitPercentage}
                onChange={(e) =>
                  setCounterForm({
                    ...counterForm,
                    splitPercentage: e.target.value,
                  })
                }
              />
            )}
            <Textarea
              label="Notes"
              placeholder="Explain your counter-offer..."
              value={counterForm.notes}
              onChange={(e) =>
                setCounterForm({ ...counterForm, notes: e.target.value })
              }
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCounterTarget(null)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCounter}>
                Send Counter-Offer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex gap-1 mb-6 rounded-lg border border-border bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active === tab
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function EmptyOffers({ tab }: { tab: string }) {
  return (
    <Card className="text-center py-12">
      <Send size={32} className="mx-auto text-text-muted mb-3" />
      <p className="text-text-muted">
        {tab === "All" || tab === "Pending"
          ? "No offers yet"
          : `No ${tab.toLowerCase()} offers`}
      </p>
    </Card>
  );
}

function OffersLoading() {
  return (
    <div className="max-w-content mx-auto">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-10 w-full mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
