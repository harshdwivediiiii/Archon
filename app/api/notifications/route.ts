import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notificationsService } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const read = searchParams.has("read") ? searchParams.get("read") === "true" : undefined;
    const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.has("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const notifications = await notificationsService.getNotifications(session.user.id, {
      ...(type ? { type: type as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
      ...(read !== undefined ? { read } : {}),
      ...(limit ? { limit } : {}),
      ...(offset ? { offset } : {}),
    });

    const unreadCount = await notificationsService.getUnreadCount(session.user.id);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.all === true) {
      await notificationsService.markAllAsRead(session.user.id);
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.id && typeof body.id === "string") {
      await notificationsService.markAsRead(body.id);
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json(
      { error: "Provide either { id: string } or { all: true }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Notifications update error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
