"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Menu,
  PlayCircle,
  X,
  ArrowRight,
  GitBranch,
  Globe,
  Code2,
  Container,
  Workflow,
  Network,
  Shield,
  RefreshCw,
  Bot,
  Layers,
  Download,
  Sparkles,
  CheckCircle2,
  GitFork,
} from "lucide-react";
import Link from "next/link";
import { getTechIcon } from "@/lib/analysis/tech-icons";

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

const featureCards = [
  {
    icon: GitFork,
    title: "Repository Intelligence",
    desc: "Understand massive codebases instantly. Auto-detect languages, frameworks, services, APIs, databases, and infrastructure.",
    color: "#0070f3",
  },
  {
    icon: Network,
    title: "Living Architecture",
    desc: "Auto-generated architecture diagrams from real code. Every commit updates the graph automatically.",
    color: "#06b6d4",
  },
  {
    icon: Layers,
    title: "UML Generation",
    desc: "Class diagrams, component diagrams, and sequence diagrams generated from actual AST analysis of your code.",
    color: "#8b5cf6",
  },
  {
    icon: Container,
    title: "Infrastructure Mapping",
    desc: "Detect Docker, Kubernetes, Terraform, AWS, GCP, and Azure configurations automatically.",
    color: "#10b981",
  },
  {
    icon: Workflow,
    title: "Dependency Analysis",
    desc: "Track service-to-service relationships, API calls, data flows, event streams, message queues, and CI/CD pipelines.",
    color: "#f59e0b",
  },
  {
    icon: BrainCircuit,
    title: "Knowledge Graph",
    desc: "Explore code relationships visually. Everything connected: files, classes, functions, services, databases, and infrastructure.",
    color: "#dbb8ff",
  },
  {
    icon: Bot,
    title: "AI Engineering Assistant",
    desc: "Ask questions about your codebase in natural language. 'Which services write to PostgreSQL?' 'What depends on Redis?'",
    color: "#ef4444",
  },
  {
    icon: Shield,
    title: "Blast Radius Analysis",
    desc: "Predict impact of changes before deployment. Visualize cascading failures and dependency chains across your entire system.",
    color: "#ffb4ab",
  },
  {
    icon: RefreshCw,
    title: "Architecture Timeline",
    desc: "Track architectural evolution across commits. See how your system changes over time with every push and PR.",
    color: "#3b82f6",
  },
];

const howItWorksSteps = [
  {
    step: 1,
    title: "Connect Repository",
    desc: "Authenticate with GitHub, GitLab, or Bitbucket. Select any repository you want to analyze.",
    icon: GitBranch,
  },
  {
    step: 2,
    title: "Import & Analyze",
    desc: "Archon clones your repo securely, parses every file, detects languages, frameworks, services, APIs, and databases.",
    icon: Code2,
  },
  {
    step: 3,
    title: "Build Digital Twin",
    desc: "A complete architecture graph is constructed with all services, dependencies, infrastructure, data flows, and API relationships.",
    icon: Layers,
  },
  {
    step: 4,
    title: "Generate Diagrams",
    desc: "System architecture, UML, infrastructure maps, data flow diagrams, and knowledge graphs are generated automatically.",
    icon: Workflow,
  },
  {
    step: 5,
    title: "Explore & Query",
    desc: "Click any node to inspect details. Ask AI questions about your architecture. Export diagrams as PNG, SVG, Mermaid, or PlantUML.",
    icon: BrainCircuit,
  },
];

const outputTabs = [
  { id: "system", label: "System Architecture", icon: Network },
  { id: "uml", label: "UML Diagram", icon: Layers },
  { id: "infra", label: "Infrastructure", icon: Container },
  { id: "dataflow", label: "Data Flow", icon: Workflow },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState("system");

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <HeroSection />
      <WorkflowSection />
      <FeatureGridSection />
      <HowItWorksSection />
      <OutputsSection activeTab={activeOutputTab} setActiveTab={setActiveOutputTab} />
      <TrustSection />
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
    <nav
      className="fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between px-6 md:px-8"
      style={{ background: "rgba(16, 19, 27, 0.6)", backdropFilter: "blur(12px)" }}
    >
      <div className="border-b border-[#414754]/50 absolute bottom-0 left-0 right-0" />
      <div className="flex items-center gap-8">
        <Link href="/">
          <span className="text-xl font-black text-[#e0e2ed] tracking-tighter">ARCHON</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#workflow" className="text-xs font-medium text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">How It Works</a>
          <a href="#features" className="text-xs font-medium text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">Features</a>
          <a href="#outputs" className="text-xs font-medium text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">Outputs</a>
          <a href="#trust" className="text-xs font-medium text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">Technologies</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/login">
          <button className="bg-[#0070f3] hover:bg-[#0060d3] text-white px-5 py-2 text-xs font-semibold rounded-full transition-all active:scale-95">
            Sign In
          </button>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#c1c6d7] md:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 border-t border-[#414754]/50 px-4 py-4 md:hidden"
          style={{ background: "rgba(16, 19, 27, 0.97)" }}
        >
          <div className="flex flex-col gap-3">
            <a href="#workflow" className="text-sm text-[#c1c6d7]">How It Works</a>
            <a href="#features" className="text-sm text-[#c1c6d7]">Features</a>
            <a href="#outputs" className="text-sm text-[#c1c6d7]">Outputs</a>
            <a href="#trust" className="text-sm text-[#c1c6d7]">Technologies</a>
            <Link href="/login" className="mt-2">
              <Button variant="default" size="sm" className="w-full rounded-full">Sign In</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[900px] flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "rgba(0,112,243,0.06)", filter: "blur(120px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "rgba(104,7,186,0.04)", filter: "blur(100px)" }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-5xl mx-auto flex flex-col items-center gap-6"
        initial="initial"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <Badge
            variant="secondary"
            className="rounded-full px-4 py-1.5 border-[#0070f3]/20"
            style={{ background: "rgba(0,112,243,0.1)", color: "#0070f3" }}
          >
            <BrainCircuit className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
            AI-Powered Engineering Intelligence
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-5xl lg:text-7xl leading-[1.05] font-extrabold tracking-tight text-[#e0e2ed] max-w-4xl"
        >
          Turn Your Codebase Into A{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0070f3] via-[#dbb8ff] to-[#0070f3]">
            Living Architecture
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-base md:text-lg text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed"
        >
          Connect any GitHub repository. Archon automatically analyzes your entire codebase, detects every service, database, API, and infrastructure component, and generates professional architecture diagrams — all powered by AI.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-[#0070f3] text-white text-base font-semibold rounded-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
            style={{ boxShadow: "0 0 20px rgba(0,112,243,0.4)" }}
          >
            <GitBranch className="w-5 h-5" />
            Connect GitHub
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#414754] text-[#e0e2ed] text-base font-semibold rounded-lg hover:bg-[#272a32] transition-all active:scale-95 flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            View Demo
          </button>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="mt-12 w-full max-w-6xl glass-panel rounded-xl overflow-hidden shadow-2xl relative"
          style={{ aspectRatio: "16/8" }}
        >
          <AnimationCanvas />
          <div className="absolute top-3 left-3 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffb4ab]/60" />
            <div className="w-3 h-3 rounded-full bg-[#dbb8ff]/60" />
            <div className="w-3 h-3 rounded-full bg-[#0070f3]/60" />
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full glass-panel">
            {["React", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS"].map((tech) => {
              const Icon = getTechIcon(tech);
              return (
                <div key={tech} className="flex items-center gap-1.5 text-[10px] text-[#c1c6d7]">
                  <Icon size={14} className="text-[#8b90a0]" />
                  <span className="hidden sm:inline">{tech}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function AnimationCanvas() {
  return (
    <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="arrowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0070f3" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0070f3" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="arrowPurple" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dbb8ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#dbb8ff" stopOpacity="0.8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Layer backgrounds */}
      <rect x="40" y="40" width="1120" height="60" rx="8" fill="#1c1f27" opacity="0.5" />
      <rect x="40" y="130" width="1120" height="60" rx="8" fill="#1c1f27" opacity="0.5" />
      <rect x="40" y="220" width="1120" height="130" rx="8" fill="#1c1f27" opacity="0.5" />
      <rect x="40" y="380" width="1120" height="60" rx="8" fill="#1c1f27" opacity="0.5" />
      <rect x="40" y="470" width="1120" height="90" rx="8" fill="#1c1f27" opacity="0.5" />

      {/* Layer labels */}
      <text x="60" y="75" fill="#8b90a0" fontSize="11" fontWeight="600" fontFamily="Geist, sans-serif">USERS</text>
      <text x="60" y="165" fill="#8b90a0" fontSize="11" fontWeight="600" fontFamily="Geist, sans-serif">CDN</text>
      <text x="60" y="255" fill="#8b90a0" fontSize="11" fontWeight="600" fontFamily="Geist, sans-serif">APPLICATION</text>
      <text x="60" y="415" fill="#8b90a0" fontSize="11" fontWeight="600" fontFamily="Geist, sans-serif">DATA</text>
      <text x="60" y="505" fill="#8b90a0" fontSize="11" fontWeight="600" fontFamily="Geist, sans-serif">INFRASTRUCTURE</text>

      {/* Animated flowing arrows between layers */}
      <path d="M600,100 L600,130" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="2" className="flow-edge-animated" />
      <path d="M600,190 L600,220" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="2" className="flow-edge-animated" style={{ animationDelay: "0.5s" }} />
      <path d="M600,350 L600,380" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="2" className="flow-edge-animated" style={{ animationDelay: "1s" }} />
      <path d="M600,440 L600,470" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="2" className="flow-edge-animated" style={{ animationDelay: "1.5s" }} />

      {/* User node */}
      <g filter="url(#glow)">
        <rect x="520" y="50" width="160" height="40" rx="20" fill="#10131b" stroke="#0070f3" strokeWidth="1.5" className="node-pulse-svg" />
        <circle cx="545" cy="70" r="12" fill="#0070f3" opacity="0.2" />
        <text x="545" y="74" textAnchor="middle" fill="#0070f3" fontSize="14">🌐</text>
        <text x="570" y="74" fill="#e0e2ed" fontSize="12" fontFamily="Geist, sans-serif" fontWeight="600">Users</text>
      </g>

      {/* CDN node */}
      <g>
        <rect x="520" y="140" width="160" height="40" rx="8" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="600" y="165" textAnchor="middle" fill="#e0e2ed" fontSize="12" fontFamily="Geist, sans-serif" fontWeight="600">Cloudflare CDN</text>
      </g>

      {/* Application layer - multi-node */}
      {/* Frontend */}
      <g className="node-pulse-svg" style={{ animationDelay: "1s" }}>
        <rect x="120" y="235" width="180" height="50" rx="8" fill="#10131b" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="145" cy="260" r="10" fill="#3b82f6" opacity="0.2" />
        <text x="145" y="264" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">R</text>
        <text x="165" y="264" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Next.js Frontend</text>
      </g>

      {/* API Gateway */}
      <g className="node-pulse-svg" style={{ animationDelay: "1.5s" }}>
        <rect x="360" y="235" width="180" height="50" rx="8" fill="#10131b" stroke="#06b6d4" strokeWidth="1.5" />
        <text x="450" y="264" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">API Gateway</text>
      </g>

      {/* Auth Service */}
      <g className="node-pulse-svg" style={{ animationDelay: "2s" }}>
        <rect x="600" y="235" width="180" height="50" rx="8" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="690" y="264" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Auth Service</text>
      </g>

      {/* Backend Services */}
      <g className="node-pulse-svg" style={{ animationDelay: "2.5s" }}>
        <rect x="840" y="235" width="180" height="50" rx="8" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
        <text x="930" y="264" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Business Services</text>
      </g>

      {/* Horizontal arrows between app nodes */}
      <path d="M300,260 L360,260" fill="none" stroke="#6366f1" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" markerEnd="url(#arrowhead)" />
      <path d="M540,260 L600,260" fill="none" stroke="#6366f1" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" markerEnd="url(#arrowhead)" style={{ animationDelay: "0.3s" }} />
      <path d="M780,260 L840,260" fill="none" stroke="#6366f1" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" markerEnd="url(#arrowhead)" style={{ animationDelay: "0.6s" }} />

      {/* Data layer */}
      <g>
        <rect x="240" y="390" width="200" height="40" rx="8" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="340" y="415" textAnchor="middle" fill="#e0e2ed" fontSize="12" fontFamily="Geist, sans-serif" fontWeight="600">PostgreSQL</text>
      </g>
      <g>
        <rect x="520" y="390" width="200" height="40" rx="8" fill="#10131b" stroke="#ef4444" strokeWidth="1.5" />
        <text x="620" y="415" textAnchor="middle" fill="#e0e2ed" fontSize="12" fontFamily="Geist, sans-serif" fontWeight="600">Redis Cache</text>
      </g>
      <g>
        <rect x="800" y="390" width="200" height="40" rx="8" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="900" y="415" textAnchor="middle" fill="#e0e2ed" fontSize="12" fontFamily="Geist, sans-serif" fontWeight="600">Elasticsearch</text>
      </g>

      {/* Infrastructure layer */}
      <g>
        <rect x="200" y="480" width="160" height="35" rx="8" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="280" y="502" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Docker</text>
      </g>
      <g>
        <rect x="440" y="480" width="160" height="35" rx="8" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="520" y="502" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Kubernetes</text>
      </g>
      <g>
        <rect x="680" y="480" width="160" height="35" rx="8" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="760" y="502" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">Terraform</text>
      </g>
      <g>
        <rect x="920" y="480" width="160" height="35" rx="8" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
        <text x="1000" y="502" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="600">AWS EKS</text>
      </g>

      {/* Arrow markers */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
        </marker>
      </defs>

      {/* Data flow arrows - animated */}
      <path d="M690,285 L690,320 L340,320 L340,390" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="6,4" className="edge-flowing" />
      <path d="M690,285 L690,320 L620,320 L620,390" fill="none" stroke="#ef4444" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="6,4" className="edge-flowing" style={{ animationDelay: "1s" }} />
      <path d="M930,285 L930,320 L900,320 L900,390" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="6,4" className="edge-flowing" style={{ animationDelay: "0.5s" }} />
    </svg>
  );
}

function WorkflowSection() {
  const workflowItems = [
    {
      icon: GitBranch,
      title: "Connect Repository",
      desc: "GitHub, GitLab, Bitbucket",
      color: "#0070f3",
    },
    {
      icon: Code2,
      title: "Analyze Codebase",
      desc: "Languages, Frameworks, Services, APIs, Databases, Infrastructure",
      color: "#06b6d4",
    },
    {
      icon: Layers,
      title: "Generate Architecture",
      desc: "System Diagrams, UML, Infrastructure Maps, Data Flow",
      color: "#8b5cf6",
    },
    {
      icon: Bot,
      title: "Query With AI",
      desc: '"Which services write to PostgreSQL?" "What depends on Redis?"',
      color: "#dbb8ff",
    },
    {
      icon: RefreshCw,
      title: "Keep Updated",
      desc: "Every commit updates the graph automatically",
      color: "#10b981",
    },
  ];

  return (
    <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div className="text-center mb-14" {...fadeInUp}>
        <Badge className="mb-4 rounded-full px-4 py-1.5 border-[#0070f3]/20" style={{ background: "rgba(0,112,243,0.1)", color: "#0070f3" }}>
          <Workflow className="mr-1.5 h-3.5 w-3.5" />
          How It Works
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2ed] mb-4 tracking-tight">
          From Repository To Architecture In Minutes
        </h2>
        <p className="text-base text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
          Connect any repository and let Archon automatically analyze, diagram, and document your entire system.
        </p>
      </motion.div>

      <div className="relative">
        <div className="hidden md:block absolute left-[47px] top-10 bottom-10 w-px bg-gradient-to-b from-[#0070f3] via-[#8b5cf6] to-[#10b981]" />

        <div className="space-y-8 relative">
          {workflowItems.map((item, i) => (
            <motion.div
              key={item.title}
              className="flex items-start gap-6 group"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className="w-[94px] h-[94px] rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105"
                style={{ background: `${item.color}10`, borderColor: `${item.color}30` }}
              >
                <item.icon className="w-8 h-8" style={{ color: item.color }} />
              </div>
              <div className="pt-3">
                <h3 className="text-xl font-bold text-[#e0e2ed] mb-1 tracking-tight">{item.title}</h3>
                <p className="text-sm text-[#c1c6d7]">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGridSection() {
  return (
    <section id="features" className="py-20 px-6" style={{ background: "rgba(11, 14, 21, 0.5)" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-14" {...fadeInUp}>
          <Badge className="mb-4 rounded-full px-4 py-1.5 border-[#0070f3]/20" style={{ background: "rgba(0,112,243,0.1)", color: "#0070f3" }}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2ed] mb-4 tracking-tight">
            Engineering Intelligence Platform
          </h2>
          <p className="text-base text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
            Everything you need to understand, document, and evolve your software architecture.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeInUp}
              className="glass-panel rounded-xl p-6 space-y-4 hover:bg-[#181b23] transition-all hover:border-[#0070f3]/30 group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                style={{ background: `${card.color}15` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#e0e2ed] tracking-tight mb-2">{card.title}</h3>
                <p className="text-sm text-[#c1c6d7] leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div className="text-center mb-14" {...fadeInUp}>
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2ed] mb-4 tracking-tight">
          From Zero To Architecture In 5 Steps
        </h2>
        <p className="text-base text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
          No setup. No configuration. No manual diagramming.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {howItWorksSteps.map((step, i) => (
          <motion.div
            key={step.title}
            className="glass-panel rounded-xl p-6 text-center relative group hover:border-[#0070f3]/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0070f3]/10 border border-[#0070f3]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#0070f3] font-mono">{step.step}</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,112,243,0.08)" }}
            >
              <step.icon className="w-6 h-6 text-[#0070f3]" />
            </div>
            <h3 className="text-sm font-bold text-[#e0e2ed] mb-2">{step.title}</h3>
            <p className="text-xs text-[#c1c6d7] leading-relaxed">{step.desc}</p>
            {i < howItWorksSteps.length - 1 && (
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <ArrowRight className="w-5 h-5 text-[#414754]" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function OutputsSection({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <section id="outputs" className="py-20 px-6" style={{ background: "rgba(11, 14, 21, 0.5)" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-10" {...fadeInUp}>
          <Badge className="mb-4 rounded-full px-4 py-1.5 border-[#0070f3]/20" style={{ background: "rgba(0,112,243,0.1)", color: "#0070f3" }}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Real Outputs
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2ed] mb-4 tracking-tight">
            Everything Auto-Generated From Your Code
          </h2>
          <p className="text-base text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
            No mockups. No templates. Every diagram is derived from actual repository analysis.
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-panel rounded-xl overflow-hidden">
          <div className="border-b border-[#414754]/30 px-4 pt-4">
            <div className="flex gap-1">
              {outputTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all ${
                      isActive
                        ? "bg-[#1c1f27] text-[#0070f3] border border-b-0 border-[#414754]/30 -mb-px"
                        : "text-[#8b90a0] hover:text-[#e0e2ed] hover:bg-[#272a32]/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "system" && <SystemArchitectureDemo />}
            {activeTab === "uml" && <UMLDemo />}
            {activeTab === "infra" && <InfrastructureDemo />}
            {activeTab === "dataflow" && <DataFlowDemo />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SystemArchitectureDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e0e2ed]">System Architecture</h3>
          <p className="text-[11px] text-[#8b90a0]">Service-oriented architecture with layered design</p>
        </div>
        <div className="flex gap-2">
          {["PNG", "SVG", "Mermaid", "PlantUML"].map((fmt) => (
            <button
              key={fmt}
              className="px-3 py-1.5 text-[10px] font-mono rounded-md border border-[#414754] text-[#8b90a0] hover:bg-[#272a32] hover:text-[#e0e2ed] transition-all"
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#414754]/30 relative" style={{ background: "#0b0e15" }}>
        <svg className="w-full" viewBox="0 0 900 320" preserveAspectRatio="xMidYMid meet">
          {/* Title */}
          <text x="450" y="30" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Architecture Overview</text>

          {/* Layer 1 - User */}
          <rect x="380" y="50" width="140" height="36" rx="18" fill="#10131b" stroke="#0070f3" strokeWidth="1.5" className="node-pulse-svg" />
          <text x="450" y="73" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Users</text>

          {/* Arrow down */}
          <path d="M450,86 L450,105" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" />

          {/* Layer 2 - Frontend */}
          <rect x="350" y="105" width="200" height="36" rx="6" fill="#10131b" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="450" y="128" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Next.js Frontend</text>

          {/* Arrow down */}
          <path d="M450,141 L450,160" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.3s" }} />

          {/* Layer 3 - Backend */}
          <rect x="300" y="160" width="300" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
          <text x="450" y="183" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">API Gateway → Auth Service → Business Logic</text>

          {/* Arrow down */}
          <path d="M450,196 L450,215" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.6s" }} />

          {/* Layer 4 - Database */}
          <rect x="250" y="215" width="400" height="36" rx="6" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="450" y="238" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL  Redis Cache  Elasticsearch  S3</text>

          {/* Arrow down */}
          <path d="M450,251 L450,270" fill="none" stroke="#0070f3" strokeOpacity="0.5" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.9s" }} />

          {/* Layer 5 - Infra */}
          <rect x="300" y="270" width="300" height="36" rx="6" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="450" y="293" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Docker  Kubernetes  Terraform  AWS</text>

          {/* Layer labels */}
          <text x="100" y="128" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">FRONTEND</text>
          <text x="100" y="183" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">SERVICES</text>
          <text x="100" y="238" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">DATA</text>
          <text x="100" y="293" textAnchor="end" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">INFRA</text>
        </svg>
      </div>
    </div>
  );
}

function UMLDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e0e2ed]">UML Class Diagram</h3>
          <p className="text-[11px] text-[#8b90a0]">Classes, interfaces, inheritance, and composition detected from code</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#414754]/30" style={{ background: "#0b0e15" }}>
        <svg className="w-full" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid meet">
          {/* Class 1 */}
          <g>
            <rect x="50" y="40" width="220" height="24" rx="4" fill="#3b82f6" opacity="0.15" />
            <rect x="50" y="64" width="220" height="24" fill="#3b82f6" opacity="0.08" />
            <rect x="50" y="88" width="220" height="24" fill="#3b82f6" opacity="0.05" />
            <rect x="50" y="40" width="220" height="72" rx="4" fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1" />
            <text x="160" y="55" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">AuthController</text>
            <text x="65" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- jwtService: JwtService</text>
            <text x="65" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ login(req, res): void</text>
          </g>

          {/* Class 2 */}
          <g>
            <rect x="340" y="40" width="220" height="24" rx="4" fill="#10b981" opacity="0.15" />
            <rect x="340" y="64" width="220" height="48" fill="#10b981" opacity="0.08" />
            <rect x="340" y="40" width="220" height="72" rx="4" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />
            <text x="450" y="55" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">UserService</text>
            <text x="355" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- userRepository: Repository</text>
            <text x="355" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ findById(id): User</text>
          </g>

          {/* Class 3 */}
          <g>
            <rect x="630" y="40" width="220" height="24" rx="4" fill="#8b5cf6" opacity="0.15" />
            <rect x="630" y="64" width="220" height="48" fill="#8b5cf6" opacity="0.08" />
            <rect x="630" y="40" width="220" height="72" rx="4" fill="none" stroke="#8b5cf6" strokeOpacity="0.4" strokeWidth="1" />
            <text x="740" y="55" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">UserEntity</text>
            <text x="645" y="79" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- id: UUID</text>
            <text x="645" y="103" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ email: string</text>
          </g>

          {/* Interface */}
          <g>
            <rect x="200" y="170" width="200" height="24" rx="4" fill="#dbb8ff" opacity="0.15" />
            <rect x="200" y="194" width="200" height="24" fill="#dbb8ff" opacity="0.08" />
            <rect x="200" y="170" width="200" height="48" rx="4" fill="none" stroke="#dbb8ff" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4" />
            <text x="300" y="185" textAnchor="middle" fill="#dbb8ff" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">«interface» IAuthService</text>
            <text x="215" y="209" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ validateToken(token): boolean</text>
          </g>

          {/* Class 4 - bottom */}
          <g>
            <rect x="500" y="170" width="200" height="24" rx="4" fill="#06b6d4" opacity="0.15" />
            <rect x="500" y="194" width="200" height="48" fill="#06b6d4" opacity="0.08" />
            <rect x="500" y="170" width="200" height="72" rx="4" fill="none" stroke="#06b6d4" strokeOpacity="0.4" strokeWidth="1" />
            <text x="600" y="185" textAnchor="middle" fill="#06b6d4" fontSize="11" fontWeight="700" fontFamily="Geist Mono, monospace">JwtService</text>
            <text x="515" y="209" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">- secretKey: string</text>
            <text x="515" y="233" fill="#c1c6d7" fontSize="9" fontFamily="Geist Mono, monospace">+ sign(payload): string</text>
          </g>

          {/* Inheritance arrow (open triangle) */}
          <polygon points="270,162 280,172 260,172" fill="none" stroke="#8b90a0" strokeWidth="1" />
          <line x1="270" y1="112" x2="270" y2="170" stroke="#8b90a0" strokeWidth="1" />

          {/* Dependency arrows */}
          <line x1="160" y1="112" x2="340" y2="90" stroke="#8b90a0" strokeWidth="1" strokeDasharray="4" />
          <text x="250" y="87" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">uses</text>

          <line x1="450" y1="112" x2="500" y2="200" stroke="#8b90a0" strokeWidth="1" strokeDasharray="4" />
          <text x="460" y="165" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">implements</text>

          {/* Composition */}
          <line x1="630" y1="76" x2="600" y2="200" stroke="#8b90a0" strokeWidth="1" />
          <polygon points="600,200 590,190 610,190" fill="#8b90a0" />
          <text x="560" y="130" fill="#8b90a0" fontSize="8" fontFamily="Geist Mono, monospace">composition</text>

          {/* Labels */}
          <text x="450" y="260" textAnchor="middle" fill="#8b90a0" fontSize="9" fontFamily="Geist, sans-serif">Auto-generated from actual AST analysis of your TypeScript/Python/Java/Go source code</text>
        </svg>
      </div>
    </div>
  );
}

function InfrastructureDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e0e2ed]">Infrastructure Diagram</h3>
          <p className="text-[11px] text-[#8b90a0]">Docker, Kubernetes, Terraform, and cloud resources detected automatically</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#414754]/30" style={{ background: "#0b0e15" }}>
        <svg className="w-full" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid meet">
          {/* Title */}
          <text x="450" y="25" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Deployment Architecture</text>

          {/* Load Balancer */}
          <rect x="370" y="45" width="160" height="36" rx="18" fill="#10131b" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="450" y="68" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Load Balancer</text>

          {/* Arrows */}
          <path d="M400,81 L350,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" />
          <path d="M450,81 L450,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.3s" }} />
          <path d="M500,81 L550,115" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.6s" }} />

          {/* Ingress */}
          <rect x="370" y="115" width="160" height="36" rx="6" fill="#10131b" stroke="#06b6d4" strokeWidth="1.5" />
          <text x="450" y="138" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">K8s Ingress</text>

          {/* Arrows down */}
          <path d="M300,151 L300,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" />
          <path d="M450,151 L450,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.3s" }} />
          <path d="M600,151 L600,190" fill="none" stroke="#8b90a0" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.6s" }} />

          {/* Services */}
          <rect x="220" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
          <text x="300" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Web Service</text>

          <rect x="370" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
          <text x="450" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Auth Service</text>

          <rect x="520" y="190" width="160" height="36" rx="6" fill="#10131b" stroke="#10b981" strokeWidth="1.5" />
          <text x="600" y="213" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">API Service</text>

          {/* Arrows to DB */}
          <path d="M300,226 L300,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" />
          <path d="M450,226 L450,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.3s" }} />
          <path d="M600,226 L600,255" fill="none" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" className="flow-edge-animated" style={{ animationDelay: "0.6s" }} />

          {/* Database */}
          <rect x="320" y="255" width="260" height="36" rx="6" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="450" y="278" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL  |  Redis  |  S3</text>
        </svg>
      </div>
    </div>
  );
}

function DataFlowDemo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e0e2ed]">Data Flow Diagram</h3>
          <p className="text-[11px] text-[#8b90a0]">Request and event flows with read/write paths</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#414754]/30" style={{ background: "#0b0e15" }}>
        <svg className="w-full" viewBox="0 0 900 280" preserveAspectRatio="xMidYMid meet">
          {/* Flow labels */}
          <text x="450" y="25" textAnchor="middle" fill="#e0e2ed" fontSize="13" fontWeight="700" fontFamily="Geist, sans-serif">Data & Event Flow</text>

          {/* Users */}
          <rect x="30" y="60" width="120" height="40" rx="20" fill="#10131b" stroke="#0070f3" strokeWidth="1.5" className="node-pulse-svg" />
          <text x="90" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Users</text>

          {/* Write path */}
          <path d="M150,80 L260,80" fill="none" stroke="#3b82f6" strokeOpacity="0.6" strokeWidth="2" className="flow-edge-animated" />
          <text x="205" y="70" textAnchor="middle" fill="#3b82f6" fontSize="8" fontFamily="Geist Mono, monospace">POST /api/login</text>

          {/* Frontend */}
          <rect x="260" y="55" width="140" height="50" rx="8" fill="#10131b" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="330" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Next.js App</text>

          {/* Auth Service */}
          <path d="M400,80 L520,80" fill="none" stroke="#10b981" strokeOpacity="0.6" strokeWidth="2" className="flow-edge-animated" style={{ animationDelay: "0.3s" }} />
          <text x="460" y="70" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="Geist Mono, monospace">Auth Request</text>

          <rect x="520" y="55" width="140" height="50" rx="8" fill="#10131b" stroke="#10b981" strokeWidth="1.5" className="node-pulse-svg" style={{ animationDelay: "0.5s" }} />
          <text x="590" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Auth Service</text>

          {/* Redis */}
          <path d="M590,105 L590,140 L330,140 L330,170" fill="none" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="6,3" className="edge-flowing" />
          <text x="460" y="130" fill="#ef4444" fontSize="8" fontFamily="Geist Mono, monospace">Session Store</text>

          <rect x="260" y="170" width="140" height="40" rx="8" fill="#10131b" stroke="#ef4444" strokeWidth="1.5" />
          <text x="330" y="195" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">Redis Cache</text>

          {/* PostgreSQL */}
          <path d="M660,80 L780,80" fill="none" stroke="#f59e0b" strokeOpacity="0.6" strokeWidth="2" className="flow-edge-animated" style={{ animationDelay: "0.6s" }} />
          <text x="720" y="70" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Geist Mono, monospace">DB Query</text>

          <rect x="780" y="55" width="110" height="50" rx="8" fill="#10131b" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="835" y="85" textAnchor="middle" fill="#e0e2ed" fontSize="11" fontWeight="600">PostgreSQL</text>

          {/* Read path (return) */}
          <path d="M660,90 L520,90" fill="none" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4" className="edge-flowing" style={{ animationDelay: "1s" }} />
          <path d="M400,90 L260,90" fill="none" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4" className="edge-flowing" style={{ animationDelay: "1.3s" }} />

          {/* Event bus */}
          <rect x="260" y="235" width="480" height="30" rx="6" fill="#10131b" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4" />
          <text x="500" y="254" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="Geist, sans-serif">Event Bus: UserCreated, SessionExpired, DataSynced</text>

          <path d="M590,105 L760,235" fill="none" stroke="#8b5cf6" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4" />
          <text x="700" y="160" fill="#8b5cf6" fontSize="8" fontFamily="Geist Mono, monospace">publish</text>

          {/* Read/Write legend */}
          <rect x="30" y="230" width="200" height="40" rx="6" fill="#1c1f27" stroke="#414754" strokeWidth="0.5" />
          <text x="45" y="248" fill="#3b82f6" fontSize="9">─ Write Path (solid)</text>
          <text x="45" y="263" fill="#10b981" fontSize="9">- - Read Path (dashed)</text>
        </svg>
      </div>
    </div>
  );
}

function TrustSection() {
  const columns = [
    { label: "Frontend", items: ["React", "Next.js", "Vue", "Angular", "Svelte"] },
    { label: "Backend", items: ["Node.js", "NestJS", "Express", "FastAPI", "Django", "Spring Boot"] },
    { label: "Databases", items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch"] },
    { label: "Infrastructure", items: ["Docker", "Kubernetes", "Terraform", "GitHub Actions"] },
    { label: "Cloud", items: ["AWS", "Azure", "GCP", "Cloudflare"] },
  ];

  return (
    <section id="trust" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div className="text-center mb-12" {...fadeInUp}>
        <Badge className="mb-4 rounded-full px-4 py-1.5 border-[#0070f3]/20" style={{ background: "rgba(0,112,243,0.1)", color: "#0070f3" }}>
          <Globe className="mr-1.5 h-3.5 w-3.5" />
          Supported Technologies
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2ed] mb-4 tracking-tight">
          Works With Your Stack
        </h2>
        <p className="text-base text-[#c1c6d7] max-w-2xl mx-auto leading-relaxed">
          Archon automatically detects and diagrams technologies across your entire ecosystem.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {columns.map((col) => (
          <motion.div key={col.label} variants={fadeInUp} className="glass-panel rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-4">{col.label}</p>
            <div className="space-y-3">
              {col.items.map((tech) => {
                const Icon = getTechIcon(tech);
                return (
                  <div key={tech} className="flex items-center gap-2.5">
                    <Icon size={16} className="text-[#8b90a0]" />
                    <span className="text-xs text-[#c1c6d7]">{tech}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden border border-[#0070f3]/20">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
            style={{ background: "rgba(0,112,243,0.08)", filter: "blur(100px)" }}
          />
        </div>
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-[#e0e2ed] leading-tight tracking-tight">
            Turn Your Codebase Into A Living Architecture
          </h2>
          <p className="text-base text-[#c1c6d7] max-w-xl mx-auto leading-relaxed">
            Connect a repository and let Archon generate everything automatically.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            {[
              "Architecture diagrams",
              "UML class diagrams",
              "Infrastructure maps",
              "Dependency graphs",
              "AI documentation",
              "Engineering insights",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-[#c1c6d7]">
                <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-5 bg-[#0070f3] text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-[#0060d3] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
            <GitBranch className="w-5 h-5" />
            Connect GitHub
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 bg-transparent border border-[#414754] text-[#e0e2ed] text-lg font-semibold rounded-xl hover:bg-[#272a32] transition-all active:scale-95 flex items-center justify-center gap-2">
              <PlayCircle className="w-5 h-5" />
              View Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#414754]/50" style={{ background: "#0b0e15" }}>
      <div className="flex flex-col md:flex-row justify-between items-start px-6 md:px-8 py-12 max-w-7xl mx-auto gap-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#e0e2ed] font-bold">ARCHON SYSTEMS</span>
          <p className="text-[#c1c6d7] text-xs mt-2">{new Date().getFullYear()} Archon Systems. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-x-12 gap-y-4">
          <div className="flex flex-col gap-3">
            <span className="text-[#e0e2ed] font-bold text-xs">Product</span>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">Documentation</a>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">API Reference</a>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">Changelog</a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[#e0e2ed] font-bold text-xs">Company</span>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">Status</a>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">Security</a>
            <a href="#" className="text-[#c1c6d7] text-xs hover:text-[#0070f3] transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
