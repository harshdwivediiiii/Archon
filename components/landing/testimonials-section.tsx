"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Archon transformed how our team understands our microservices architecture. What used to take days of documentation now happens in minutes. The knowledge graph is a game-changer for onboarding.",
    name: "Sarah Chen",
    role: "CTO",
    company: "TechCorp",
    initials: "SC",
  },
  {
    quote: "We evaluated several architecture visualization tools, but Archon's AI-powered analysis and automatic diagram generation set it apart. It's become an essential part of our engineering workflow.",
    name: "Marcus Johnson",
    role: "Lead Engineer",
    company: "ScaleUp",
    initials: "MJ",
  },
  {
    quote: "The impact analysis alone saved us from a major production incident. Being able to visualize dependency chains before deploying gives our team confidence we never had before.",
    name: "Priya Patel",
    role: "VP Engineering",
    company: "FinStack",
    initials: "PP",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-14"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4 tracking-tight">Trusted by Engineering Teams</h2>
        <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto">
          Thousands of engineering teams use Archon to understand, document, and evolve their architecture.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className="glass rounded-2xl p-6 flex flex-col justify-between border border-outline-variant/30"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <div>
              <svg className="w-8 h-8 text-primary-container mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
              </svg>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/30">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-primary-container/15 text-primary-container">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
