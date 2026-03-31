"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <div className="md:hidden">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          Bandwire
        </Link>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <button
          className="relative rounded-md p-2 text-text-muted hover:text-text-primary transition-colors duration-default"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
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
