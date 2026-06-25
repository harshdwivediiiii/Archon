"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-md border-b border-outline-variant h-16 flex items-center justify-between px-6 md:px-8">
      <div className="flex items-center gap-8">
        <Link href="/">
          <span className="text-xl md:text-headline-md font-black text-on-surface tracking-tighter">ARCHON</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">Features</a>
          <a href="#how-it-works" className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">How It Works</a>
          <a href="#technology" className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">Technology</a>
          <a href="#docs" className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors">Documentation</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <Link href="/dashboard">
            <div className="flex items-center gap-2.5 rounded-full border border-outline-variant/30 bg-surface/40 px-3 py-1.5 pr-4 transition-colors hover:bg-surface/60">
              <UserAvatar
                name={session.user.name}
                email={session.user.email}
                image={session.user.image}
                className="h-7 w-7"
              />
              <span className="text-xs font-medium text-on-surface">
                {session.user.name || "Dashboard"}
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/login">
            <Button
              variant="default"
              className="rounded-full px-5 py-2 text-xs font-semibold"
            >
              Sign In
            </Button>
          </Link>
        )}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-on-surface-variant md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 border-t border-outline-variant/50 px-4 py-4 md:hidden bg-surface/97 backdrop-blur-md"
        >
          <div className="flex flex-col gap-3">
            <a href="#features" className="text-sm text-on-surface-variant py-2">Features</a>
            <a href="#how-it-works" className="text-sm text-on-surface-variant py-2">How It Works</a>
            <a href="#technology" className="text-sm text-on-surface-variant py-2">Technology</a>
            <Link href="/login" className="mt-2">
              <Button variant="default" size="sm" className="w-full rounded-full">Sign In</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
