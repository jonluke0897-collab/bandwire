"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Building2, Guitar } from "lucide-react";
import { VenueProfileForm } from "@/components/features/venue-profile-form";
import { MusicianProfileForm } from "@/components/features/musician-profile-form";
import { Skeleton } from "@/components/ui/skeleton";

type Role = "venue" | "musician" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.users.me);
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  useEffect(() => {
    if (user && user.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Loading state
  if (user === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </main>
    );
  }

  // Already onboarded
  if (user && user.onboardingComplete) {
    return null;
  }

  // Role selection step
  if (!selectedRole) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary">
              Welcome to Bandwire
            </h1>
            <p className="mt-2 text-text-muted text-lg">
              How will you use the platform?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              hoverable
              className="flex flex-col items-center text-center py-10 px-6"
              onClick={() => setSelectedRole("venue")}
            >
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Building2 size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                I&apos;m a Venue / Promoter
              </h2>
              <p className="text-sm text-text-muted">
                Post open dates, discover bands, and book live music for your space.
              </p>
            </Card>

            <Card
              hoverable
              className="flex flex-col items-center text-center py-10 px-6"
              onClick={() => setSelectedRole("musician")}
            >
              <div className="rounded-full bg-secondary/10 p-4 mb-4">
                <Guitar size={40} className="text-secondary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                I&apos;m a Musician / Band
              </h2>
              <p className="text-sm text-text-muted">
                Build your profile, get discovered by venues, and land gigs.
              </p>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  // Profile setup step
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-narrow">
        <button
          onClick={() => setSelectedRole(null)}
          className="text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          &larr; Back to role selection
        </button>

        {selectedRole === "venue" ? (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Set up your venue
            </h1>
            <p className="text-text-muted mb-8">
              Tell us about your space so we can match you with the right bands.
            </p>
            <VenueProfileForm />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Set up your profile
            </h1>
            <p className="text-text-muted mb-8">
              Show venues what you&apos;re about. The more you fill out, the
              better your matches.
            </p>
            <MusicianProfileForm />
          </>
        )}
      </div>
    </main>
  );
}
