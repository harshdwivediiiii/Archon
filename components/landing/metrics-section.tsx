"use client";

import { motion } from "framer-motion";
import { GitBranch, Network, Workflow, BrainCircuit } from "lucide-react";

const metrics = [
  {
    value: "10,000+",
    label: "Repositories Analyzed",
    icon: GitBranch,
  },
  {
    value: "50,000+",
    label: "Architecture Nodes",
    icon: Network,
  },
  {
    value: "200,000+",
    label: "Dependencies Mapped",
    icon: Workflow,
  },
  {
    value: "1M+",
    label: "AI Insights Generated",
    icon: BrainCircuit,
  },
];

export function MetricsSection() {
  return (
    <section className="py-16 px-6 border-y border-outline-variant/30 bg-surface-container-lowest/50">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {metrics.map(({ value, label, icon: Icon }) => (
          <motion.div
            key={label}
            className="flex flex-col items-center gap-2 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5 text-primary-container" />
            <span className="text-2xl md:text-3xl font-bold text-on-surface">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
