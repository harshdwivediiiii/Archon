"use client";

import { motion } from "framer-motion";
import { GitBranch, Code2, Layers, Bot, RefreshCw, Workflow } from "lucide-react";

const steps = [
  {
    icon: GitBranch,
    title: "Connect Repository",
    desc: "Connect your GitHub, GitLab, or Bitbucket repository to Archon.",
    color: "#0070f3",
  },
  {
    icon: Code2,
    title: "Analyze Codebase",
    desc: "Archon parses every file, detects languages, frameworks, services, APIs, and databases.",
    color: "#06b6d4",
  },
  {
    icon: Layers,
    title: "Build Knowledge Graph",
    desc: "A complete architecture graph is constructed with all services, dependencies, and data flows.",
    color: "#8b5cf6",
  },
  {
    icon: Workflow,
    title: "Generate Architecture",
    desc: "System architecture, UML, infrastructure maps, and data flow diagrams are generated automatically.",
    color: "#dbb8ff",
  },
  {
    icon: Bot,
    title: "Ask AI Questions",
    desc: 'Query your architecture: "Which services write to PostgreSQL?"',
    color: "#10b981",
  },
  {
    icon: RefreshCw,
    title: "Track Changes Over Time",
    desc: "Every commit updates the graph automatically. See how your architecture evolves.",
    color: "#f59e0b",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">From Repository To Insights In Minutes</h2>
        <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
          No setup. No configuration. No manual diagramming.
        </p>
      </motion.div>

      <div className="relative">
        <div className="hidden md:block absolute left-[47px] top-10 bottom-10 w-px bg-gradient-to-b from-[#0070f3] via-[#8b5cf6] to-[#10b981]" />

        <div className="space-y-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="flex items-start gap-6 group"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className="w-[94px] h-[94px] rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105"
                style={{
                  background: `${step.color}10`,
                  borderColor: `${step.color}30`,
                }}
              >
                <step.icon className="w-8 h-8" style={{ color: step.color }} />
              </div>
              <div className="pt-3">
                <h3 className="text-xl font-bold text-on-surface mb-1 tracking-tight">{step.title}</h3>
                <p className="text-sm text-on-surface-variant">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
