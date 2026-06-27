import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentationClient } from "./client";

export default async function DocumentationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <DocumentationClient />;
}
