"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Sparkles, ArrowRight, Zap, Users, Building2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with basic features",
    features: ["2 repositories", "50 AI queries/month", "Basic diagrams", "1 workspace"],
    cta: "Current Plan",
    popular: false,
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For individual developers",
    features: ["Unlimited repositories", "Unlimited AI queries", "Advanced diagrams", "Knowledge graphs", "GitHub integration"],
    cta: "Upgrade to Pro",
    popular: true,
    current: false,
  },
  {
    name: "Team",
    price: "$99",
    description: "For growing teams",
    features: ["Everything in Pro", "Team collaboration", "Role management", "Shared workspaces", "Priority support"],
    cta: "Upgrade to Team",
    popular: false,
    current: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations",
    features: ["Everything in Team", "Self-hosted", "SSO/SAML", "Custom integrations", "Dedicated support"],
    cta: "Contact Sales",
    popular: false,
    current: false,
  },
];

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <p className="text-zinc-400">Manage your subscription and usage</p>
          </div>
          <Button variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Methods
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Current Plan", value: "Free", icon: Sparkles, color: "blue" },
            { label: "AI Queries Used", value: "48 / 50", icon: Zap, color: "purple" },
            { label: "Team Members", value: "1 / 3", icon: Users, color: "emerald" },
            { label: "Storage Used", value: "256 MB", icon: Building2, color: "blue" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`rounded-lg bg-${stat.color}-600/10 p-3`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative transition-all ${
                plan.popular ? "border-blue-600 shadow-lg shadow-blue-500/10" : "hover:border-blue-600/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600">Most Popular</Badge>
                </div>
              )}
              <CardContent className="flex flex-col p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-sm text-zinc-400">/month</span>}
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  className="w-full"
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
            <CardDescription>Your recent API usage and billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { date: "Jun 21, 2026", queries: 12, storage: "10 MB", status: "active" },
                { date: "Jun 20, 2026", queries: 8, storage: "5 MB", status: "active" },
                { date: "Jun 19, 2026", queries: 15, storage: "8 MB", status: "active" },
              ].map((usage) => (
                <div
                  key={usage.date}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <div>
                    <p className="text-sm text-white">{usage.date}</p>
                    <p className="text-xs text-zinc-500">{usage.queries} AI queries</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{usage.storage} storage</span>
                    <Badge variant="success" className="text-xs">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
