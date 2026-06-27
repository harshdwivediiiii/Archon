import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DockerDashboardClient } from "./client";

export default async function DockerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <DockerDashboardClient />;
}
