"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitGraph, BrainCircuit, Eye, GitFork, Map, RefreshCw, Shield, Workflow } from "lucide-react";

const features = [
  {
    icon: GitFork,
    title: "Repository Intelligence",
    desc: "Understand codebase structures across poly-repo setups as if they were a single, coherent system.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
  },
  {
    icon: GitGraph,
    title: "Living Architecture",
    desc: "Real-time sync with GitHub, Terraform, and Kubernetes ensures your graph is always the source of truth.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
    details: ["Git Provider Integration", "Infrastructure Mapping", "CI/CD Pipeline Visualization"],
    large: true,
  },
  {
    icon: BrainCircuit,
    title: "Knowledge Graph",
    desc: "Explore code relationships visually. Everything connected: files, classes, functions, services, databases, and infrastructure.",
    color: "text-secondary",
    bg: "bg-secondary/20",
  },
  {
    icon: BrainCircuit,
    title: "AI Mentor",
    desc: "Query your architecture in natural language. 'Where are the circular dependencies in the billing microservice?'",
    color: "text-secondary",
    bg: "bg-secondary/20",
    quote: '"Show me all services exposed to public internet without mTLS..."',
  },
  {
    icon: Map,
    title: "Impact Analysis",
    desc: "Instantly visualize the impact of an outage or a security vulnerability across your entire graph.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
  },
  {
    icon: RefreshCw,
    title: "Architecture Timeline",
    desc: "Track architectural evolution across commits. See how your system changes over time with every push and PR.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
  },
  {
    icon: Shield,
    title: "Security Analysis",
    desc: "Detect vulnerable dependencies, exposed ports, and security misconfigurations across your entire stack.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
  },
  {
    icon: Workflow,
    title: "Dependency Mapping",
    desc: "Track service-to-service relationships, API calls, data flows, event streams, message queues, and CI/CD pipelines.",
    color: "text-primary-container",
    bg: "bg-primary-container/20",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-surface-container-lowest/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.h2
              className="text-[32px] md:text-4xl text-on-surface mb-4 font-extrabold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Engineering Intelligence.
            </motion.h2>
            <motion.p
              className="text-base md:text-lg text-on-surface-variant"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Archon connects every dot across your entire stack automatically.
            </motion.p>
          </div>
          <a
            href="#"
            className="text-primary-container text-xs font-medium flex items-center gap-2 hover:underline shrink-0"
          >
            Explore all features <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            if (feature.large) {
              return (
                <motion.div
                  key={feature.title}
                  className="md:col-span-8 glass rounded-2xl border border-outline-variant/20 p-8 flex flex-col md:flex-row gap-8 overflow-hidden group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="flex-1 space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
                    {feature.details && (
                      <ul className="space-y-2 pt-4">
                        {feature.details.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-xs text-on-surface">
                            <Eye className="w-4 h-4 text-primary shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex-1 min-h-[200px] bg-surface-container-high rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30 group-hover:scale-105 transition-transform duration-700 engineering-grid" />
                  </div>
                </motion.div>
              );
            }

            if (feature.quote) {
              return (
                <motion.div
                  key={feature.title}
                  className="md:col-span-4 glass rounded-2xl border border-outline-variant/20 p-8 flex flex-col justify-between group hover:border-primary-container/40"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
                  </div>
                  <div className="mt-8 p-4 bg-surface-container-highest rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant italic font-mono">
                    {feature.quote}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={feature.title}
                className="md:col-span-4 glass rounded-2xl border border-outline-variant/20 p-8 space-y-4 hover:bg-surface-container-low transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Icon className="text-primary-container w-10 h-10" strokeWidth={1.5} />
                <h3 className="text-2xl font-bold text-on-surface tracking-tight">{feature.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
