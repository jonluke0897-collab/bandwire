"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Calendar,
  BookOpen,
  Send,
  Search,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const venueNavItems = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/offers", label: "Offers", icon: Send },
  { href: "/dashboard/browse", label: "Browse", icon: Search },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const musicianNavItems = [
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/offers", label: "Offers", icon: Send },
  { href: "/dashboard/browse", label: "Browse", icon: Search },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useQuery(api.users.me);

  const navItems = user?.role === "musician" ? musicianNavItems : venueNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-border bg-surface py-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
              isActive ? "text-primary" : "text-text-muted"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
