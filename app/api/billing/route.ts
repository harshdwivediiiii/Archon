import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { isIntegrationConfigured } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = isIntegrationConfigured("STRIPE_SECRET_KEY") &&
    isIntegrationConfigured("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  if (!configured) {
    return NextResponse.json({
      configured: false,
      plan: "Free",
      status: "active",
      currentPeriodEnd: null,
    });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json({
      configured: true,
      plan: "FREE",
      status: "inactive",
      currentPeriodEnd: null,
    });
  }

  return NextResponse.json({
    configured: true,
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
}
