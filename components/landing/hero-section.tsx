"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PlayCircle, GitBranch, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

function KnowledgeGraphSVG() {
  return (
    <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet">
      <path className="text-primary-container/40" d="M150,225 L350,150" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
      <path className="text-primary-container/40" d="M150,225 L350,300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
      <path className="text-secondary/40" d="M350,150 L550,150" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
      <path className="text-secondary/40" d="M350,300 L550,300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
      <path className="text-primary-container/40" d="M550,150 L750,225" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />
      <path className="text-primary-container/40" d="M550,300 L750,225" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4" />

      <g className="animate-data-pulse">
        <circle className="fill-surface stroke-primary-container" cx="150" cy="225" r="30" strokeWidth="2" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="150" y="270">REPO</text>
      </g>
      <g className="animate-data-pulse" style={{ animationDelay: "0.5s" }}>
        <circle className="fill-surface stroke-primary-container" cx="350" cy="150" r="25" strokeWidth="1.5" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="350" y="195">AUTH SERVICE</text>
      </g>
      <g className="animate-data-pulse" style={{ animationDelay: "1s" }}>
        <circle className="fill-surface stroke-primary-container" cx="350" cy="300" r="25" strokeWidth="1.5" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="350" y="345">PAYMENT API</text>
      </g>
      <g className="animate-data-pulse" style={{ animationDelay: "1.5s" }}>
        <circle className="fill-surface stroke-secondary" cx="550" cy="150" r="25" strokeWidth="1.5" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="550" y="195">REDIS CACHE</text>
      </g>
      <g className="animate-data-pulse" style={{ animationDelay: "2s" }}>
        <circle className="fill-surface stroke-secondary" cx="550" cy="300" r="25" strokeWidth="1.5" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="550" y="345">POSTGRES</text>
      </g>
      <g className="animate-data-pulse" style={{ animationDelay: "2.5s" }}>
        <circle className="fill-surface stroke-primary-container" cx="750" cy="225" r="35" strokeWidth="2" />
        <text className="fill-on-surface text-[10px] font-mono" textAnchor="middle" x="750" y="275">AWS EKS</text>
      </g>
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[795px] flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-24">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-secondary-container/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container text-xs font-mono"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          AI-Powered Knowledge Graphs
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-[42px] md:text-5xl lg:text-6xl leading-[1.1] text-on-surface font-extrabold tracking-tight"
        >
          Understand Any System{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary">
            Instantly.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
        >
          Transform your codebase and cloud infrastructure into a living, breathing knowledge graph. No more stale diagrams or manual documentation.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-primary-container text-on-primary-container text-base font-semibold rounded-lg shadow-[0_0_20px_rgba(0,112,243,0.4)] hover:shadow-[0_0_30px_rgba(0,112,243,0.6)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <GitBranch className="w-5 h-5" />
            Connect Repository
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-8 py-4 text-base rounded-lg flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Watch Demo
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 mt-16 w-full max-w-5xl aspect-[16/9] glass rounded-xl border border-outline-variant/30 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <KnowledgeGraphSVG />
        </div>
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="w-3 h-3 rounded-full bg-error/40" />
          <div className="w-3 h-3 rounded-full bg-secondary/40" />
          <div className="w-3 h-3 rounded-full bg-primary-container/40" />
        </div>
      </motion.div>
    </section>
  );
}
