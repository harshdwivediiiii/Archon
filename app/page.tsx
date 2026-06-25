"use client";

import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemsSection } from "@/components/landing/problems-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { TechSupport } from "@/components/landing/tech-support";
import { MetricsSection } from "@/components/landing/metrics-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemsSection />
      <FeaturesSection />
      <MetricsSection />
      <HowItWorks />
      <InteractiveDemo />
      <TechSupport />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
