"use client";

import { useState, useRef, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bell } from "lucide-react";
import Link from "next/link";
import { NotificationList } from "@/components/features/notification-list";

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.notifications.unreadCount);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <div className="md:hidden">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          Bandwire
        </Link>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            className="relative rounded-md p-2 text-text-muted hover:text-text-primary transition-colors duration-default"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationList onClose={() => setShowNotifications(false)} />
          )}
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </header>
  );
}
