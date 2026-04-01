"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useState, useEffect } from "react";
import { Crown, Mail, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const user = useQuery(api.users.me);
  const status = useQuery(api.subscriptions.getStatus);
  const createCheckout = useAction(api.subscriptions.createCheckout);
  const [upgrading, setUpgrading] = useState(false);

  // Show success toast when returning from Polar checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast("Payment processing! Your Pro subscription will activate shortly.");
    }
  }, [searchParams]);

  if (!user || status === undefined) {
    return (
      <div className="max-w-narrow mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const checkoutUrl = await createCheckout();
      window.location.href = checkoutUrl;
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
      setUpgrading(false);
    }
  };

  return (
    <div className="max-w-narrow mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* Account Info */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-primary" />
          <h2 className="text-lg font-medium">Account</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Name</span>
            <span>{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Username</span>
            <span className="font-mono">@{user.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Role</span>
            <Badge variant={user.role === "venue" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Subscription Status — venues only */}
      {user.role === "venue" && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown size={20} className="text-warning" />
            <h2 className="text-lg font-medium">Subscription</h2>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge
                variant={status.tier === "pro" ? "success" : "default"}
                className="text-sm"
              >
                {status.tier === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
            {status.tier === "pro" && (
              <a
                href="https://polar.sh/settings/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Manage Subscription
              </a>
            )}
          </div>

          {/* Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-muted">Offers this month</span>
              <span>
                {status.tier === "pro"
                  ? `${status.offersThisMonth} (Unlimited)`
                  : `${status.offersThisMonth} / ${status.offerLimit}`}
              </span>
            </div>
            {status.tier === "free" && (
              <div className="h-2 rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min((status.offersThisMonth / 5) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Upgrade CTA */}
          {status.tier === "free" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="font-medium mb-1">Upgrade to Pro</h3>
              <p className="text-sm text-text-muted mb-3">
                Unlimited offers, priority matching, and more. $29/month.
              </p>
              <Button onClick={handleUpgrade} disabled={upgrading}>
                {upgrading ? "Redirecting to checkout..." : "Upgrade to Pro"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Notification Preferences */}
      <NotificationPreferences
        emailPreferences={user.emailPreferences}
      />
    </div>
  );
}

function NotificationPreferences({
  emailPreferences,
}: {
  emailPreferences?: {
    newOffers: boolean;
    offerResponses: boolean;
    bookingUpdates: boolean;
    marketing: boolean;
  };
}) {
  const updatePrefs = useMutation(api.users.updateEmailPreferences);
  const [prefs, setPrefs] = useState({
    newOffers: emailPreferences?.newOffers ?? true,
    offerResponses: emailPreferences?.offerResponses ?? true,
    bookingUpdates: emailPreferences?.bookingUpdates ?? true,
    marketing: emailPreferences?.marketing ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = async (
    key: keyof typeof prefs,
    value: boolean
  ) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await updatePrefs(updated);
    } catch {
      // revert on error
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const toggles: {
    key: keyof typeof prefs;
    label: string;
    description: string;
  }[] = [
    {
      key: "newOffers",
      label: "New offers",
      description: "Get emailed when you receive a booking offer",
    },
    {
      key: "offerResponses",
      label: "Offer responses",
      description: "Get emailed when an offer is accepted or declined",
    },
    {
      key: "bookingUpdates",
      label: "Booking updates",
      description: "Get emailed about booking changes and cancellations",
    },
    {
      key: "marketing",
      label: "Marketing",
      description: "Tips, updates, and news from Bandwire",
    },
  ];

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Bell size={20} className="text-info" />
        <h2 className="text-lg font-medium">Email Notifications</h2>
        {saving && (
          <span className="text-xs text-text-muted">Saving...</span>
        )}
      </div>
      <div className="space-y-4">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-text-muted">{t.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[t.key]}
              onClick={() => handleToggle(t.key, !prefs[t.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[t.key] ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs[t.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
