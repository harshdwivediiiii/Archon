import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SecurityDashboardClient } from "./client";

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <SecurityDashboardClient />;
}
