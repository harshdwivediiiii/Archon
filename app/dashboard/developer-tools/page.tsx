import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DeveloperToolsClient } from "./client";

export default async function DeveloperToolsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <DeveloperToolsClient />;
}
