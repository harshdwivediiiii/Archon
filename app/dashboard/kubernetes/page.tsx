import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { KubernetesClientPage } from "./client";

export default async function KubernetesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <KubernetesClientPage />;
}
