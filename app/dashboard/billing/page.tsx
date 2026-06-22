"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Wrench } from "lucide-react";

interface BillingInfo {
  configured: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/billing");
        if (!cancelled && res.ok) {
          setBilling(await res.json());
        } else if (!cancelled) {
          setBilling({ configured: false, plan: "Free", status: "active", currentPeriodEnd: null });
        }
      } catch {
        if (!cancelled) {
          setBilling({ configured: false, plan: "Free", status: "active", currentPeriodEnd: null });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!billing?.configured) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Billing</h1>
            <p className="text-zinc-400">Manage your subscription and usage</p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
                <Wrench className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">Billing Not Configured</h3>
              <p className="mb-6 max-w-md text-center text-sm text-zinc-400">
                Stripe billing is not yet configured. To enable billing features, set up your Stripe
                account and configure the required environment variables (STRIPE_SECRET_KEY,
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).
              </p>
              <div className="flex gap-3">
                <Button variant="outline" disabled>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing Unavailable
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the Free plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Free Plan</p>
                  <p className="text-xs text-zinc-500">Basic features included</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
              <div>
                <p className="text-lg font-medium text-white">{billing.plan} Plan</p>
                <p className="text-sm text-zinc-500">
                  Status: {billing.status}
                  {billing.currentPeriodEnd && (
                    <> · Renews {new Date(billing.currentPeriodEnd).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <Badge variant="success">{billing.status}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
