"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Cpu,
  Database,
  Dock,
  FileText,
  GitBranch,
  Globe,
  Menu,
  Network,
  Search,
  Server,
  Shield,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
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
    <div className="min-h-screen bg-black">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <DemoSection />
      <ArchitectureShowcase />
      <KnowledgeGraphShowcase />
      <AIAssistantShowcase />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
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
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Archon</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-zinc-400 transition-colors hover:text-white">
            Pricing
          </Link>
          <Link href="#faq" className="text-sm text-zinc-400 transition-colors hover:text-white">
            FAQ
          </Link>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">
              Start Free
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-zinc-400 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-zinc-800 bg-zinc-900 px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            <Link href="#features" className="text-sm text-zinc-400">Features</Link>
            <Link href="#pricing" className="text-sm text-zinc-400">Pricing</Link>
            <Link href="#faq" className="text-sm text-zinc-400">FAQ</Link>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button className="w-full">Start Free</Button>
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
    <section className="relative overflow-hidden pt-32 pb-20 sm:pb-28">
      <div className="hero-gradient pointer-events-none absolute inset-0" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" initial="initial" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
              AI-Powered Architecture Intelligence
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Understand{" "}
            <span className="text-gradient">Any System</span>{" "}
            Instantly
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400"
          >
            Transform repositories, documentation, and infrastructure into living architecture
            powered by AI. Explore interactive diagrams, knowledge graphs, and get instant
            system understanding.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-base shadow-2xl shadow-blue-500/25">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="text-base">
                <PlayIcon className="mr-2 h-5 w-5" />
                Book Demo
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeInUp} className="mt-16">
            <div className="glass-card mx-auto max-w-5xl overflow-hidden rounded-2xl">
              <div className="aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800 to-blue-900/20 p-1">
                <div className="flex h-full items-center justify-center">
                  <div className="relative h-full w-full">
                    <ArchitectureAnimation />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
    </svg>
  );
}

function ArchitectureAnimation() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: Server, label: "Services", color: "blue" },
          { icon: Database, label: "Databases", color: "purple" },
          { icon: Globe, label: "APIs", color: "emerald" },
          { icon: Dock, label: "Docker", color: "blue" },
          { icon: GitBranch, label: "GitHub", color: "purple" },
          { icon: Network, label: "K8s", color: "emerald" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.5, duration: 0.4 }}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 backdrop-blur-sm"
          >
            <div className={`rounded-lg bg-${item.color}-600/20 p-2`}>
              <item.icon className={`h-6 w-6 text-${item.color}-400`} />
            </div>
            <span className="text-xs text-zinc-400">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrustedBySection() {
  return (
    <section className="border-y border-zinc-800/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-zinc-500" {...fadeInUp}>
          Trusted by engineering teams worldwide
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8"
          {...fadeInUp}
        >
          {["Vercel", "Linear", "Stripe", "Figma", "Arc", "Notion"].map((name) => (
            <div key={name} className="flex items-center gap-2 text-zinc-600">
              <div className="h-6 w-6 rounded-full bg-zinc-800" />
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Network,
      title: "Interactive Architecture Diagrams",
      description: "Visualize your entire system with interactive, zoomable diagrams. Services, APIs, databases, and infrastructure all in one view.",
      color: "blue",
    },
    {
      icon: GitBranch,
      title: "Repository Intelligence",
      description: "Connect GitHub repositories and get instant understanding of code structure, dependencies, and architecture patterns.",
      color: "purple",
    },
    {
      icon: Search,
      title: "Knowledge Graph",
      description: "Explore relationships between components, services, and concepts through an interactive knowledge graph.",
      color: "emerald",
    },
    {
      icon: Cpu,
      title: "AI-Powered Explanations",
      description: "Ask AI questions about your architecture. Get instant explanations, recommendations, and system understanding.",
      color: "blue",
    },
    {
      icon: FileText,
      title: "Documentation to Diagrams",
      description: "Upload PDFs, technical notes, and documentation. AI extracts architecture and generates visual diagrams automatically.",
      color: "purple",
    },
    {
      icon: Shield,
      title: "Dependency Mapping",
      description: "Automatically map dependencies between services, libraries, and infrastructure components across your stack.",
      color: "emerald",
    },
    {
      icon: BarChart3,
      title: "System Analytics",
      description: "Get insights into your architecture health, complexity scores, and recommendations for improvements.",
      color: "blue",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share diagrams, annotate changes, and collaborate on architecture decisions with your team in real-time.",
      color: "purple",
    },
    {
      icon: Zap,
      title: "Infrastructure Understanding",
      description: "Parse Docker, Kubernetes, and cloud configurations into visual architecture components automatically.",
      color: "emerald",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to understand{" "}
            <span className="text-gradient">any system</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            From code to infrastructure, Archon gives you complete architectural intelligence.
          </p>
        </motion.div>
        <motion.div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Card className="group h-full transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-500/10">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-lg bg-${feature.color}-600/10 p-3`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <Badge variant="secondary" className="mb-4">Product Demo</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            See Archon in{" "}
            <span className="text-gradient">action</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Watch how Archon transforms complex systems into understandable architecture.
          </p>
        </motion.div>
        <motion.div className="mt-12" {...fadeInUp}>
          <div className="glass-card mx-auto max-w-5xl overflow-hidden rounded-2xl">
            <div className="aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800 to-blue-900/20 p-8">
              <Tabs defaultValue="diagram" className="h-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="diagram">Architecture Diagram</TabsTrigger>
                  <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
                  <TabsTrigger value="chat">AI Assistant</TabsTrigger>
                </TabsList>
                <TabsContent value="diagram" className="h-[70%]">
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
                    <div className="text-center">
                      <Network className="mx-auto h-12 w-12 text-blue-400" />
                      <p className="mt-3 text-sm text-zinc-400">Interactive Architecture Diagram</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="graph" className="h-[70%]">
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
                    <div className="text-center">
                      <GitBranch className="mx-auto h-12 w-12 text-purple-400" />
                      <p className="mt-3 text-sm text-zinc-400">Knowledge Graph Visualization</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="chat" className="h-[70%]">
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
                    <div className="text-center">
                      <Sparkles className="mx-auto h-12 w-12 text-emerald-400" />
                      <p className="mt-3 text-sm text-zinc-400">AI Assistant Chat</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ArchitectureShowcase() {
  return (
    <section className="border-y border-zinc-800/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="grid items-center gap-12 lg:grid-cols-2" variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4">Architecture Explorer</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Explore your architecture{" "}
              <span className="text-gradient">visually</span>
            </h2>
            <p className="mt-4 text-zinc-400">
              Interactive diagrams with zoom, pan, and search. Understand how every service,
              API, database, and infrastructure component connects in real-time.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Real-time interactive diagrams",
                "Service dependency visualization",
                "Infrastructure component mapping",
                "Zoom, pan, and search controls",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <div className="glass-card aspect-square overflow-hidden rounded-2xl p-6">
              <div className="flex h-full items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/30">
                <div className="grid grid-cols-2 gap-4">
                  {[Server, Database, Globe, Network].map((Icon, i) => (
                    <div key={i} className="flex items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-6">
                      <Icon className="h-8 w-8 text-blue-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function KnowledgeGraphShowcase() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="grid items-center gap-12 lg:grid-cols-2" variants={staggerContainer}>
          <motion.div className="order-2 lg:order-1" variants={fadeInUp}>
            <div className="glass-card aspect-square overflow-hidden rounded-2xl p-6">
              <div className="flex h-full items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/30">
                <div className="flex flex-wrap justify-center gap-3">
                  {["API", "DB", "Auth", "Cache", "Queue", "Worker", "CDN", "DNS"].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div className="order-1 lg:order-2" variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4">Knowledge Graph</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Discover system{" "}
              <span className="text-gradient">relationships</span>
            </h2>
            <p className="mt-4 text-zinc-400">
              Explore how components relate to each other through an interactive knowledge graph.
              Search, filter, and drill down into any node for contextual insights.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Interactive relationship exploration",
                "Search and filter capabilities",
                "Contextual node insights",
                "Dependency chain visualization",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-purple-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function AIAssistantShowcase() {
  return (
    <section className="border-y border-zinc-800/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="grid items-center gap-12 lg:grid-cols-2" variants={staggerContainer}>
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4">AI Assistant</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ask AI about your{" "}
              <span className="text-gradient">architecture</span>
            </h2>
            <p className="mt-4 text-zinc-400">
              Get instant answers about your system. Understand dependencies, get recommendations,
              and explore your architecture through natural conversation.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Natural language system queries",
                "Architecture recommendations",
                "Dependency analysis",
                "Streaming AI responses",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Cpu className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-xl bg-zinc-800 px-4 py-2">
                    <p className="text-sm text-zinc-300">How does the authentication service connect to the database?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="rounded-xl bg-blue-600/10 px-4 py-2">
                    <p className="text-sm text-zinc-300">
                      The auth service connects to PostgreSQL via a connection pool managed by PgBouncer.
                      It uses SSL with certificate authentication. The database is deployed on AWS R3 with
                      automated failover to a read replica in us-west-2.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                  <Input
                    placeholder="Ask about your architecture..."
                    className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
                  />
                  <Button size="sm" className="shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with basic architecture intelligence.",
      features: ["2 repositories", "50 AI queries/month", "Basic diagrams", "1 workspace"],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      description: "For individual developers and small teams.",
      features: [
        "Unlimited repositories",
        "Unlimited AI queries",
        "Advanced diagrams",
        "Knowledge graphs",
        "GitHub integration",
      ],
      cta: "Start Pro",
      popular: true,
    },
    {
      name: "Team",
      price: "$99",
      description: "For growing teams that need collaboration.",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Role management",
        "Shared workspaces",
        "Priority support",
      ],
      cta: "Start Team",
      popular: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations with advanced needs.",
      features: [
        "Everything in Team",
        "Self-hosted option",
        "SSO/SAML",
        "Custom integrations",
        "Dedicated support",
        "SLA agreement",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Simple, transparent{" "}
            <span className="text-gradient">pricing</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </motion.div>
        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
        >
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={fadeInUp}>
              <Card
                className={`relative h-full transition-all duration-300 ${
                  plan.popular
                    ? "border-blue-600 shadow-lg shadow-blue-500/10"
                    : "hover:border-blue-600/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-sm text-zinc-400">/month</span>}
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-blue-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Engineering Manager",
      company: "Vercel",
      content:
        "Archon transformed how our team understands complex microservices. The knowledge graph is incredible.",
    },
    {
      name: "Marcus Johnson",
      role: "Staff Engineer",
      company: "Linear",
      content:
        "We use Archon to onboard new engineers. It cuts architecture understanding time from weeks to hours.",
    },
    {
      name: "Emily Rodriguez",
      role: "DevOps Lead",
      company: "Stripe",
      content:
        "The infrastructure parsing is amazing. Archon automatically maps our entire K8s setup.",
    },
  ];

  return (
    <section className="border-y border-zinc-800/50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Loved by engineering{" "}
            <span className="text-gradient">teams</span>
          </h2>
        </motion.div>
        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={fadeInUp}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-blue-400 text-blue-400" />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-300">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{testimonial.name}</p>
                      <p className="text-xs text-zinc-500">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "What is Archon?",
      a: "Archon is an AI-powered Architecture Intelligence Platform that helps teams understand complex systems through interactive diagrams, knowledge graphs, and AI-powered analysis.",
    },
    {
      q: "How does the GitHub integration work?",
      a: "Connect your GitHub repositories and Archon automatically analyzes your code structure, dependencies, and architecture. It creates visual diagrams and knowledge graphs from your codebase.",
    },
    {
      q: "Can I upload existing documentation?",
      a: "Yes, Archon supports PDFs, technical notes, and infrastructure configurations. Our AI extracts architecture information and generates visual diagrams automatically.",
    },
    {
      q: "Is my data secure?",
      a: "Yes, all data is encrypted in transit and at rest. We use industry-standard security practices and comply with SOC 2 requirements.",
    },
    {
      q: "Do you offer self-hosted deployment?",
      a: "Yes, Enterprise plan includes self-hosted deployment options for organizations with specific compliance requirements.",
    },
  ];

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeInUp}>
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Frequently asked{" "}
            <span className="text-gradient">questions</span>
          </h2>
        </motion.div>
        <motion.div className="mt-12" {...fadeInUp}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div className="glass-card relative overflow-hidden rounded-3xl p-12 text-center" {...fadeInUp}>
          <div className="hero-gradient pointer-events-none absolute inset-0" />
          <div className="relative">
            <Badge variant="secondary" className="mb-4">
              Get Started
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Ready to understand your{" "}
              <span className="text-gradient">architecture</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Join thousands of engineering teams using Archon to understand, document, and
              improve their systems.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="text-base shadow-2xl shadow-blue-500/25">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="text-base">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">Archon</span>
          </div>
          <div className="flex gap-8">
            <Link href="#features" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
              FAQ
            </Link>
          </div>
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Archon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
