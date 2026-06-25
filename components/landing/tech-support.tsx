"use client";

import { motion } from "framer-motion";
import { Globe, Code2, Database, Container, Cloud } from "lucide-react";

const techCategories = [
  {
    label: "Git Providers",
    icon: Globe,
    items: [
      { name: "GitHub", color: "#fff" },
      { name: "GitLab", color: "#fc6d26" },
      { name: "Bitbucket", color: "#2684ff" },
    ],
  },
  {
    label: "Frontend",
    icon: Code2,
    items: [
      { name: "Next.js", color: "#fff" },
      { name: "React", color: "#61dafb" },
      { name: "Vue", color: "#4fc08d" },
      { name: "Angular", color: "#dd0031" },
      { name: "Svelte", color: "#ff3e00" },
    ],
  },
  {
    label: "Backend",
    icon: Code2,
    items: [
      { name: "Node.js", color: "#339933" },
      { name: "Python", color: "#3776AB" },
      { name: "Java", color: "#007396" },
      { name: "Go", color: "#00ADD8" },
      { name: "Rust", color: "#fff" },
    ],
  },
  {
    label: "Databases & Queue",
    icon: Database,
    items: [
      { name: "PostgreSQL", color: "#4169E1" },
      { name: "MongoDB", color: "#47A248" },
      { name: "Redis", color: "#DC382D" },
      { name: "Kafka", color: "#231F20" },
      { name: "Elasticsearch", color: "#005571" },
    ],
  },
  {
    label: "Infrastructure",
    icon: Container,
    items: [
      { name: "Docker", color: "#2496ED" },
      { name: "Kubernetes", color: "#326CE5" },
      { name: "Terraform", color: "#7B42BC" },
      { name: "GitHub Actions", color: "#2088FF" },
    ],
  },
  {
    label: "Cloud",
    icon: Cloud,
    items: [
      { name: "AWS", color: "#FF9900" },
      { name: "Azure", color: "#0078D4" },
      { name: "GCP", color: "#4285F4" },
      { name: "Cloudflare", color: "#F38020" },
    ],
  },
];

export function TechSupport() {
  return (
    <section id="technology" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">Works With Your Stack</h2>
        <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
          Archon automatically detects and diagrams technologies across your entire ecosystem.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {techCategories.map((cat, i) => (
          <motion.div
            key={cat.label}
            className="glass rounded-xl p-5 border border-outline-variant/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <cat.icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</p>
            </div>
            <div className="space-y-2.5">
              {cat.items.map((tech) => (
                <div key={tech.name} className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tech.color }}
                  />
                  <span className="text-xs text-on-surface-variant">{tech.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
