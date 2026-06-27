import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatClient } from "./client";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <ChatClient />;
}
