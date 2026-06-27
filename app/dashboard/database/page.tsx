import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DatabaseDashboardClient } from "./client";

export default async function DatabasePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <DatabaseDashboardClient />;
}
