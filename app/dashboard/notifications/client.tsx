"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Shield,
  GitBranch,
  Rocket,
  BrainCircuit,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

type NotificationType = "general" | "security" | "github" | "deployment" | "ai";
type NotificationPriority = "critical" | "high" | "medium" | "low";
type FilterTab = "all" | "unread" | "github" | "security" | "deployments" | "ai";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  priority: NotificationPriority;
  read: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "security", title: "New login from unknown device", description: "A login was detected from a new device in San Francisco, CA.", timestamp: new Date(Date.now() - 300000).toISOString(), priority: "critical", read: false },
  { id: "2", type: "deployment", title: "Deployment successful", description: "api-gateway v2.4.1 deployed to production successfully.", timestamp: new Date(Date.now() - 3600000).toISOString(), priority: "low", read: false },
  { id: "3", type: "github", title: "Pull request merged", description: "PR #342 'Fix auth timeout' was merged to main.", timestamp: new Date(Date.now() - 7200000).toISOString(), priority: "medium", read: false },
  { id: "4", type: "ai", title: "AI analysis complete", description: "Code review for PR #342 has been completed with 3 suggestions.", timestamp: new Date(Date.now() - 10800000).toISOString(), priority: "medium", read: true },
  { id: "5", type: "general", title: "Weekly report ready", description: "Your weekly project summary is now available.", timestamp: new Date(Date.now() - 86400000).toISOString(), priority: "low", read: true },
  { id: "6", type: "security", title: "SSL certificate expiring", description: "The SSL certificate for api.archon.dev will expire in 7 days.", timestamp: new Date(Date.now() - 172800000).toISOString(), priority: "high", read: true },
  { id: "7", type: "deployment", title: "Deployment failed", description: "frontend v3.1.0 deployment failed due to health check timeout.", timestamp: new Date(Date.now() - 259200000).toISOString(), priority: "critical", read: true },
  { id: "8", type: "github", title: "New repository created", description: "Repository 'archon/docs' was created in your organization.", timestamp: new Date(Date.now() - 345600000).toISOString(), priority: "low", read: true },
];

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  general: <Bell className="h-5 w-5 text-zinc-400" />,
  security: <Shield className="h-5 w-5 text-red-400" />,
  github: <GitBranch className="h-5 w-5 text-zinc-400" />,
  deployment: <Rocket className="h-5 w-5 text-blue-400" />,
  ai: <BrainCircuit className="h-5 w-5 text-purple-400" />,
};

const priorityColors: Record<NotificationPriority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-zinc-500",
};

const priorityVariants: Record<NotificationPriority, "destructive" | "warning" | "default" | "secondary"> = {
  critical: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
};

export function NotificationsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch notifications");
      }
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingAll(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", notificationId: id }),
      });
    } catch { /* ignore */ }
  };

  const filteredNotifications = notifications.filter((n) => {
    switch (activeFilter) {
      case "all": return true;
      case "unread": return !n.read;
      case "github": return n.type === "github";
      case "security": return n.type === "security";
      case "deployments": return n.type === "deployment";
      case "ai": return n.type === "ai";
      default: return true;
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "github", label: "GitHub" },
    { id: "security", label: "Security" },
    { id: "deployments", label: "Deployments" },
    { id: "ai", label: "AI" },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-zinc-400">Stay updated with alerts and activity</p>
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-6 px-2 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
            >
              {markingAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeFilter === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter(tab.id)}
              className="text-xs"
            >
              {tab.label}
              {tab.id === "unread" && unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  {activeFilter === "all"
                    ? "All notifications"
                    : activeFilter === "unread"
                    ? "Unread notifications"
                    : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} notifications`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                <p className="text-sm text-zinc-400">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchNotifications} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Bell className="h-12 w-12 text-zinc-600 mb-3" />
                <p className="text-lg font-medium text-zinc-500">No notifications yet</p>
                <p className="text-sm text-zinc-600 mt-1">
                  {activeFilter !== "all" ? "No notifications match this filter" : "You're all caught up!"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification, idx) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.link) window.open(notification.link, "_blank");
                    }}
                    className={`flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors ${
                      notification.read
                        ? "hover:bg-zinc-800/30"
                        : "bg-blue-600/5 border border-blue-600/10 hover:bg-blue-600/10"
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`rounded-lg p-2 ${
                        notification.type === "security" ? "bg-red-600/10" :
                        notification.type === "deployment" ? "bg-blue-600/10" :
                        notification.type === "github" ? "bg-zinc-600/10" :
                        notification.type === "ai" ? "bg-purple-600/10" :
                        "bg-zinc-600/10"
                      }`}>
                        {notificationIcons[notification.type]}
                      </div>
                      {!notification.read && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${notification.read ? "text-zinc-300" : "text-white font-medium"}`}>
                          {notification.title}
                        </p>
                        <Badge
                          variant={priorityVariants[notification.priority]}
                          className="shrink-0 h-5 px-1.5 text-[10px]"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read ? "text-zinc-500" : "text-zinc-400"}`}>
                        {notification.description}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
