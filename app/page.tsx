"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle,
  Database,
  EyeOff,
  FileText,
  GitBranch,
  Menu,
  Network,
  PlayCircle,
  Search,
  Shield,
  Sparkles,
  UserMinus,
  X,
} from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <HeroSection />
      <ProblemsSection />
      <FeatureGridSection />
      <CTASection />
      <Footer />
    </div>
  );
}

function Navbar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  return (
    <nav className="fixed top-0 z-50 w-full glass border-b border-outline-variant/30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-on-surface">
            ARCHON
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#"
            className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Platform
          </Link>
          <Link
            href="#"
            className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Solutions
          </Link>
          <Link
            href="#"
            className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Documentation
          </Link>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:text-on-surface">
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden rounded border border-outline-variant/30 bg-surface-dim px-1.5 py-0.5 text-[11px] font-mono text-on-surface-variant lg:inline">
              ⌘K
            </kbd>
          </button>
          <Link href="/login">
            <Button variant="default" size="sm" className="rounded-full">
              Sign In
            </Button>
          </Link>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-on-surface-variant md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-outline-variant/30 bg-surface px-4 py-4 md:hidden glass"
        >
          <div className="flex flex-col gap-3">
            <Link href="#" className="text-sm text-on-surface-variant">
              Platform
            </Link>
            <Link href="#" className="text-sm text-on-surface-variant">
              Solutions
            </Link>
            <Link href="#" className="text-sm text-on-surface-variant">
              Documentation
            </Link>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full rounded-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[795px] overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="hero-gradient pointer-events-none absolute inset-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex flex-col items-center text-center"
          initial="initial"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-sm"
            >
              <BrainCircuit className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
              AI-Powered Knowledge Graphs
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-on-surface"
          >
            Understand Any System{" "}
            <span className="text-gradient">Instantly.</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant"
          >
            Transform your codebase into a living knowledge graph. Map every
            service, dependency, and data flow across your entire
            architecture&mdash;powered by AI.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full text-base shadow-2xl shadow-blue-500/25"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full text-base"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-16 w-full">
            <div className="glass-card mx-auto max-w-5xl overflow-hidden rounded-2xl p-1">
              <div className="aspect-[16/9] w-full">
                <KnowledgeGraphVisualization />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function KnowledgeGraphVisualization() {
  const nodes = [
    { id: "repo", label: "REPO", cx: 400, cy: 70, color: "#0070f3" },
    { id: "auth", label: "AUTH SERVICE", cx: 160, cy: 175, color: "#6807ba" },
    { id: "payment", label: "PAYMENT API", cx: 640, cy: 175, color: "#0070f3" },
    { id: "redis", label: "REDIS CACHE", cx: 120, cy: 300, color: "#6807ba" },
    { id: "postgres", label: "POSTGRES", cx: 400, cy: 380, color: "#0070f3" },
    { id: "eks", label: "AWS EKS", cx: 680, cy: 300, color: "#6807ba" },
  ];

  const edges = [
    ["repo", "auth"],
    ["repo", "payment"],
    ["auth", "redis"],
    ["auth", "postgres"],
    ["payment", "postgres"],
    ["payment", "redis"],
    ["redis", "eks"],
    ["postgres", "eks"],
  ];

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <div className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <svg
        className="h-full w-full graph-canvas"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid meet"
      >
      <defs>
        <style>
          {`
            @keyframes edge-flow {
              to { stroke-dashoffset: 0; }
            }
            .animate-edge-flow {
              stroke-dashoffset: -10;
              animation: edge-flow 1.5s linear infinite;
            }
            @keyframes node-glow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
            .node-glow {
              animation: node-glow 2s ease-in-out infinite;
            }
          `}
        </style>
      </defs>
      {edges.map(([fromId, toId]) => {
        const from = nodes.find((n) => n.id === fromId)!;
        const to = nodes.find((n) => n.id === toId)!;
        return (
          <line
            key={`${fromId}-${toId}`}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            stroke="#414754"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="animate-edge-flow"
          />
        );
      })}
      {nodes.map((node) => (
        <g
          key={node.id}
          className="animate-node-pulse node-glow"
          style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
        >
          <circle
            cx={node.cx}
            cy={node.cy}
            r="20"
            fill={node.color}
            opacity="0.15"
          />
          <circle cx={node.cx} cy={node.cy} r="10" fill={node.color} />
          <circle
            cx={node.cx}
            cy={node.cy}
            r="10"
            fill="none"
            stroke={node.color}
            strokeWidth="2"
            opacity="0.6"
          />
          <text
            x={node.cx}
            y={node.cy + 34}
            textAnchor="middle"
            fill="#c1c6d7"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            className="font-mono text-[10px]"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
    </div>
  );
}

function ProblemsSection() {
  const problems = [
    {
      icon: FileText,
      title: "Outdated Documentation",
      description:
        "Docs drift the moment they're written. Your README doesn't reflect the 12 microservices you added last quarter.",
    },
    {
      icon: UserMinus,
      title: "Teams Losing Context",
      description:
        "New hires spend weeks mapping dependencies. Senior engineers hold the architecture in their heads\u2014until they leave.",
    },
    {
      icon: EyeOff,
      title: "Hidden Dependencies",
      description:
        "One change in a shared library breaks five services. You don't see the blast radius until production goes dark.",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Architecture Drift is{" "}
            <span className="text-gradient">Real</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-on-surface-variant">
            Every commit, every migration, every hotfix pushes your system
            further from what the diagrams show.
          </p>
        </motion.div>
        <motion.div
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
        >
          {problems.map((problem) => (
            <motion.div key={problem.title} variants={fadeInUp}>
              <div className="glass-panel group h-full rounded-2xl p-6 transition-all duration-300 hover:border-primary-container/50 hover:shadow-lg hover:shadow-primary-container/10">
                <div className="mb-4 inline-flex rounded-lg bg-primary-container/10 p-3">
                  <problem.icon className="h-6 w-6 text-primary-container" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-on-surface">
                  {problem.title}
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureGridSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
          {...fadeInUp}
        >
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Engineering Intelligence
            </h2>
            <p className="mt-2 text-on-surface-variant">
              Everything your team needs to stay aligned.
            </p>
          </div>
          <Link
            href="#"
            className="hidden items-center gap-1 text-sm text-primary-container transition-colors hover:underline sm:flex"
          >
            Explore all features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-12 gap-4">
          <motion.div
            className="col-span-12 lg:col-span-8"
            variants={fadeInUp}
          >
            <div className="glass-panel flex h-full flex-col rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-primary-container/10 p-2">
                  <Network className="h-5 w-5 text-primary-container" />
                </div>
                <h3 className="text-lg font-semibold">Living Architecture</h3>
              </div>
              <ul className="mb-6 space-y-2">
                {[
                  "Auto-generated from your codebase",
                  "Real-time dependency mapping",
                  "Interactive drill-down into any node",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-on-surface-variant"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary-container" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-4">
                <div className="flex aspect-video items-center justify-center rounded-lg border border-outline-variant/10 bg-surface-dim">
                  <Network className="h-8 w-8 text-on-surface-variant/50" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            variants={fadeInUp}
          >
            <div className="glass-panel flex h-full flex-col rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-secondary-container/10 p-2">
                  <BrainCircuit className="h-5 w-5 text-secondary-container" />
                </div>
                <h3 className="text-lg font-semibold">AI Insights</h3>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="relative">
                  <div className="glass max-w-[220px] rounded-xl p-4">
                    <p className="text-sm italic text-on-surface-variant">
                      &ldquo;This endpoint has no rate limiting &mdash; consider
                      adding one.&rdquo;
                    </p>
                  </div>
                  <Sparkles className="absolute -right-2 -top-2 h-4 w-4 text-secondary-container" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            variants={fadeInUp}
          >
            <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-primary-container/50">
              <div className="mb-4 inline-flex rounded-lg bg-primary-container/10 p-2">
                <Database className="h-5 w-5 text-primary-container" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Data Lineage</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Trace every data flow from API to database. See exactly how your
                data moves through the system.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            variants={fadeInUp}
          >
            <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-primary-container/50">
              <div className="mb-4 inline-flex rounded-lg bg-primary-container/10 p-2">
                <GitBranch className="h-5 w-5 text-primary-container" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Repo Intelligence</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Connect any Git repository and instantly visualize its
                architecture, services, and dependencies.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 sm:col-span-6 lg:col-span-4"
            variants={fadeInUp}
          >
            <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:border-primary-container/50">
              <div className="mb-4 inline-flex rounded-lg bg-primary-container/10 p-2">
                <Shield className="h-5 w-5 text-primary-container" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Blast Radius Analysis
              </h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Before you change any component, see every service that will be
                affected&mdash;before it hits production.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-6 flex items-center justify-center sm:hidden"
          variants={fadeInUp}
        >
          <Link
            href="#"
            className="flex items-center gap-1 text-sm text-primary-container transition-colors hover:underline"
          >
            Explore all features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="gradient-border rounded-3xl" {...fadeInUp}>
          <div className="glass-panel relative overflow-hidden rounded-3xl p-12 text-center sm:p-16">
            <div className="hero-gradient pointer-events-none absolute inset-0" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                Ready to map the{" "}
                <span className="text-gradient">future</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-on-surface-variant">
                Join engineering teams that never lose track of their
                architecture.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="shimmer-ai rounded-full border-0 px-8 text-base text-white"
                  >
                    Get Started for Free
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full text-base"
                >
                  Talk to Sales
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-outline-variant/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-sm font-bold tracking-tight text-on-surface">
              ARCHON SYSTEMS
            </span>
            <p className="mt-2 text-xs text-on-surface-variant">
              Architecture Intelligence for modern engineering teams.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  API Reference
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  Status
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/20 pt-8 sm:flex-row">
          <p className="text-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} Archon Systems. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
