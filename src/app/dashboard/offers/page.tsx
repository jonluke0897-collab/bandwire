"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/features/offer-card";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["All", "Pending", "Accepted", "Declined", "Countered"] as const;

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const offers = useQuery(api.offers.listSent);

  if (offers === undefined) {
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

  const filtered =
    activeTab === "All"
      ? offers
      : offers.filter(
          (o) => o.status === activeTab.toLowerCase()
        );

  return (
    <div className="max-w-content mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Sent Offers</h1>

      <div className="flex gap-1 mb-6 rounded-lg border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary/10 text-primary"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Send size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted">
            {activeTab === "All"
              ? "No offers sent yet"
              : `No ${activeTab.toLowerCase()} offers`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <OfferCard key={offer._id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
