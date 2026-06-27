import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CodeReviewDashboardClient } from "./client";

export default async function CodeReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <CodeReviewDashboardClient />;
}
