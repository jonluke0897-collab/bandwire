"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useQuery(api.users.me);

  useEffect(() => {
    // user is undefined while loading, null if not found
    if (user === null) {
      router.replace("/onboarding");
      return;
    }
    if (user && !user.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Loading state
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // Redirect in progress
  if (!user || !user.onboardingComplete) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-sidebar">
        <Header />
        <main className="p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
