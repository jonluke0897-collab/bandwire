"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Calendar,
  Users,
  BookOpen,
  Send,
  Search,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const venueNav = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/matches", label: "Matches", icon: Users },
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/offers", label: "Offers", icon: Send },
  { href: "/dashboard/browse", label: "Browse", icon: Search },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const musicianNav = [
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/offers", label: "Offers", icon: Send },
  { href: "/dashboard/browse", label: "Browse", icon: Search },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useQuery(api.users.me);

  const navItems = user?.role === "musician" ? musicianNav : venueNav;

  return (
    <aside className="hidden md:flex md:flex-col md:w-sidebar md:fixed md:inset-y-0 bg-surface border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="text-xl font-bold text-primary font-logo">
          Bandwire
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-default",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user?.role === "venue" && (
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center justify-between px-3">
            <Badge
              variant={
                user.subscriptionTier === "pro" ? "success" : "secondary"
              }
            >
              {user.subscriptionTier === "pro" ? "Pro" : "Free"}
            </Badge>
            {user.subscriptionTier === "free" && (
              <Link
                href="/dashboard/settings"
                className="text-xs text-primary hover:underline"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
