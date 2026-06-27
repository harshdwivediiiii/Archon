import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DevOpsDashboardClient } from "./client";

export default async function DevOpsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <DevOpsDashboardClient />;
}
