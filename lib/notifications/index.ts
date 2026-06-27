import { prisma } from "@/lib/db/prisma";

export const NotificationType = {
  GitHubEvent: "github_event",
  Deployment: "deployment",
  SecurityAlert: "security_alert",
  BuildFailure: "build_failure",
  ContainerCrash: "container_crash",
  PodRestart: "pod_restart",
  AiSuggestion: "ai_suggestion",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationPriority = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string | null;
  priority: NotificationPriority;
  read: boolean;
  link: string | null;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
  userId: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  description?: string;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationsService {
  async getNotifications(userId: string, filters: NotificationFilters = {}): Promise<Notification[]> {
    const where: Record<string, unknown> = { userId };

    if (filters.type) where.type = filters.type;
    if (filters.priority) where.priority = filters.priority;
    if (filters.read !== undefined) where.read = filters.read;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    }) as Promise<Notification[]>;
  }

  async markAsRead(id: string): Promise<void> {
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async createNotification(userId: string, input: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        link: input.link ?? null,
        metadata: input.metadata as object | null ?? undefined,
      },
    }) as Promise<Notification>;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
    }) as Promise<Notification[]>;
  }

  async dismissNotification(id: string): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }
}

export const notificationsService = new NotificationsService();
