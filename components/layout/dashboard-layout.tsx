"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  CreditCard,
  Cpu,
  GitBranch,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Search,
  Settings,
  Sparkles,
  Telescope,
  Users,
  X,
  Bell,
  MessageSquare,
  BarChart3,
  Code2,
  Container,
  Ship,
  GitCompare,
  Shield,
  FileText,
  Wrench,
  Database,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { UserMenu } from "@/components/ui/user-menu";
import { UserAvatar } from "@/components/ui/user-avatar";
import { GlobalSearch } from "@/components/ui/global-search";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { id: "projects", label: "Projects", href: "/dashboard/projects", icon: BookOpen },
      { id: "repositories", label: "Repositories", href: "/dashboard/repositories", icon: GitBranch },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { id: "chat", label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
      { id: "ai-assistant", label: "AI Assistant", href: "/dashboard/ai-assistant", icon: BrainCircuit },
      { id: "architecture", label: "Architecture", href: "/dashboard/architecture", icon: Network },
      { id: "knowledge-graph", label: "Knowledge Graph", href: "/dashboard/knowledge-graph", icon: Sparkles },
      { id: "repository-galaxy", label: "Repository Galaxy", href: "/dashboard/repository-galaxy", icon: Telescope },
    ],
  },
  {
    title: "Development",
    items: [
      { id: "code-review", label: "Code Review", href: "/dashboard/code-review", icon: Code2 },
      { id: "analytics", label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { id: "documentation", label: "Documentation", href: "/dashboard/documentation", icon: FileText },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { id: "kubernetes", label: "Kubernetes", href: "/dashboard/kubernetes", icon: Container },
      { id: "docker", label: "Docker", href: "/dashboard/docker", icon: Ship },
      { id: "devops", label: "DevOps", href: "/dashboard/devops", icon: GitCompare },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "security", label: "Security", href: "/dashboard/security", icon: Shield },
      { id: "database", label: "Database", href: "/dashboard/database", icon: Database },
      { id: "timeline", label: "Timeline", href: "/dashboard/timeline", icon: History },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "team", label: "Team", href: "/dashboard/team", icon: Users },
      { id: "billing", label: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
      { id: "notifications", label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
];

const bottomItems: SidebarItem[] = [];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#10131b] text-[#e0e2ed]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#414754] bg-[#10131b] transition-transform duration-300 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[#c1c6d7] hover:bg-[#272a32] md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0070f3]">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter text-[#e0e2ed]">
              ARCHON
            </span>
          </Link>
        </div>

        <div className="mx-3 mb-2 flex items-center gap-3 rounded-lg border border-[#414754] bg-[#1c1f27] p-3">
          <UserAvatar
            name={session?.user?.name}
            email={session?.user?.email}
            image={session?.user?.image}
            className="h-9 w-9"
          />
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-[#e0e2ed]">
              {session?.user?.name || "User"}
            </p>
            <p className="truncate text-xs text-[#c1c6d7]">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <nav className="flex flex-col gap-4">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "border-l-2 border-[#0070f3] bg-[#0070f3]/5 font-semibold text-[#0070f3]"
                            : "text-[#c1c6d7] hover:bg-[#272a32] hover:text-[#e0e2ed]"
                        )}
                      >
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mx-3 mb-3 rounded-xl border border-[#6807ba] bg-white/[0.04] p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6807ba]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#e0e2ed]">PRO PLAN</span>
          </div>
          <p className="mb-3 text-xs text-[#c1c6d7]">
            Enterprise Access with priority support and advanced features.
          </p>
          <div className="mb-2 h-1.5 w-full rounded-full bg-[#272a32]">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#0070f3] to-[#6807ba]" />
          </div>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#0070f3] py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90">
            Upgrade
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="border-t border-[#414754] p-3">
          <button
            onClick={() => signOut({ redirectTo: "/" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#c1c6d7] transition-colors hover:bg-[#272a32] hover:text-[#e0e2ed]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="fixed right-0 top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#414754] bg-[#10131b]/80 px-4 backdrop-blur-xl md:w-[calc(100%-260px)] md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-[#c1c6d7] hover:bg-[#272a32] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-[#e0e2ed]">
              Project Architecture
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[#414754] bg-[#1c1f27] px-4 py-1.5 text-sm focus-within:ring-1 focus-within:ring-[#0070f3] hover:border-zinc-600 transition-colors"
            >
              <Search className="h-4 w-4 text-[#c1c6d7]" />
              <span className="text-[#c1c6d7]">Search...</span>
              <kbd className="hidden rounded-md border border-[#414754] bg-[#272a32] px-1.5 py-0.5 text-xs text-[#c1c6d7] md:inline-flex">
                ⌘K
              </kbd>
            </button>

            <button className="rounded-lg p-2 text-[#c1c6d7] hover:bg-[#272a32]">
              <Bell className="h-5 w-5" />
            </button>

            <UserMenu />
          </div>
        </header>

        <div className="h-16" />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
