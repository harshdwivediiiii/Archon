"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  BookOpen,
  Bot,
  ChevronLeft,
  Cpu,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Settings,
  Sparkles,
  Users,
  History,
} from "lucide-react";
import { signOut } from "next-auth/react";

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: BookOpen },
  { label: "Repositories", href: "/dashboard/repositories", icon: GitBranch },
  { label: "Architecture", href: "/dashboard/architecture", icon: Network },
  { label: "Knowledge Graph", href: "/dashboard/knowledge-graph", icon: Sparkles },
  { label: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { label: "Timeline", href: "/dashboard/timeline", icon: History },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-300 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && <span className="text-sm font-bold text-white">Archon</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:block"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600/10 text-blue-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                    !sidebarOpen && "lg:justify-center lg:px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={() => signOut({ redirectTo: "/" })}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative">
              <input
                placeholder="Search..."
                className="w-64 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-80"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Activity className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
