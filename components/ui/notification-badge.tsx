"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NotificationBadgeProps {
  count?: number;
  className?: string;
  onClick?: () => void;
}

export function NotificationBadge({ count = 0, className, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg p-2 text-[#c1c6d7] hover:bg-[#272a32] transition-colors",
        className
      )}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#0070f3] px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
