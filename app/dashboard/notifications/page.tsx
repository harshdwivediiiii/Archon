import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationsClient } from "./client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <NotificationsClient />;
}
