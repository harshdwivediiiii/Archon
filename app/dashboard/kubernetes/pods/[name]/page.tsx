import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PodDetailClient } from "./client";

export default async function PodDetailPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <PodDetailClient />;
}
