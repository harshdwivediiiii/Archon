"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto glass rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden border border-primary-container/20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-container/10 blur-[100px]" />
        </div>
        <div className="relative z-10 space-y-8">
          <motion.h2
            className="text-[36px] md:text-5xl text-on-surface leading-tight font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to map the future?
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join the teams at Vercel, Stripe, and Figma who use Archon to ship faster and break less.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-5 bg-primary-container text-on-primary-container text-lg font-semibold rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(0,112,243,0.4)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
            >
              <GitBranch className="w-5 h-5" />
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#"
              className="w-full sm:w-auto px-10 py-5 bg-transparent border border-outline-variant text-on-surface text-lg font-semibold rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
            >
              Talk to Sales
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
