import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AnalyticsClient } from "./client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <AnalyticsClient />;
}
