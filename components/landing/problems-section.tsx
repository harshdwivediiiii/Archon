"use client";

import { motion } from "framer-motion";
import { History, Users, EyeOff } from "lucide-react";

const problems = [
  {
    icon: History,
    title: "Outdated Documentation",
    desc: "Wiki pages that haven't been updated since 2021 are worse than no documentation at all.",
    color: "text-error",
  },
  {
    icon: Users,
    title: "Teams Losing Context",
    desc: "Onboarding takes months because tribal knowledge is trapped in Slack threads and heads.",
    color: "text-secondary",
  },
  {
    icon: EyeOff,
    title: "Hidden Dependencies",
    desc: "Merging a 'simple' change breaks three downstream services you didn't know existed.",
    color: "text-primary-container",
  },
];

export function ProblemsSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">Architecture Drift is Real</h2>
        <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
          Current tools fail to capture the reality of your evolving technical ecosystem.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            className="glass rounded-xl p-8 border border-outline-variant/30 hover:border-primary-container/40 transition-all group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <problem.icon className={`${problem.color} mb-4 block w-10 h-10`} strokeWidth={1.5} />
            <h3 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">{problem.title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{problem.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
