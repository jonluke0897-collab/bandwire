"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  CheckCircle,
  XCircle,
  ArrowLeftRight,
  BookOpen,
  Bell,
} from "lucide-react";

const typeIcons: Record<string, typeof Bell> = {
  new_offer: Send,
  offer_accepted: CheckCircle,
  offer_declined: XCircle,
  offer_countered: ArrowLeftRight,
  booking_confirmed: BookOpen,
  booking_cancelled: XCircle,
};

export function NotificationList({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const notifications = useQuery(api.notifications.list);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const handleClick = async (n: NonNullable<typeof notifications>[number]) => {
    if (!n.isRead) {
      await markRead({ notificationId: n._id });
    }
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-surface shadow-glow z-50">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text-primary">Notifications</h3>
        <button
          type="button"
          onClick={() => markAllRead({})}
          className="text-xs text-primary hover:underline"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications === undefined ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <button
                key={n._id}
                type="button"
                onClick={() => handleClick(n)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors border-b border-border last:border-0"
              >
                <Icon
                  size={16}
                  className={n.isRead ? "text-text-muted mt-0.5" : "text-primary mt-0.5"}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${n.isRead ? "text-text-muted" : "text-text-primary font-medium"}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-text-muted truncate">{n.message}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
