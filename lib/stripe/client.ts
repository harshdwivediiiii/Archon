import Stripe from "stripe";
import { getEnv, isIntegrationConfigured } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isIntegrationConfigured("STRIPE_SECRET_KEY")) {
    return null;
  }

  if (!stripeClient) {
    const env = getEnv();
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export type StripeDiagnosticResult = {
  ok: boolean;
  status: "connected" | "warning" | "failed";
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasWebhookSecret: boolean;
  accountId?: string;
  latencyMs?: number;
  error?: string;
};

export async function testStripeConnection(): Promise<StripeDiagnosticResult> {
  const start = Date.now();
  const hasSecretKey = isIntegrationConfigured("STRIPE_SECRET_KEY");
  const hasPublishableKey = isIntegrationConfigured("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  const hasWebhookSecret = isIntegrationConfigured("STRIPE_WEBHOOK_SECRET");

  if (!hasSecretKey) {
    return {
      ok: false,
      status: "warning",
      hasSecretKey,
      hasPublishableKey,
      hasWebhookSecret,
      error: "STRIPE_SECRET_KEY is not configured",
    };
  }

  try {
    const stripe = getStripe();
    if (!stripe) {
      throw new Error("Stripe client failed to initialize");
    }

    const balance = await stripe.balance.retrieve();
    const missingKeys = [
      !hasPublishableKey && "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      !hasWebhookSecret && "STRIPE_WEBHOOK_SECRET",
    ].filter(Boolean);

    return {
      ok: true,
      status: missingKeys.length > 0 ? "warning" : "connected",
      hasSecretKey,
      hasPublishableKey,
      hasWebhookSecret,
      accountId: balance.object,
      latencyMs: Date.now() - start,
      error:
        missingKeys.length > 0
          ? `Missing optional keys: ${missingKeys.join(", ")}`
          : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      hasSecretKey,
      hasPublishableKey,
      hasWebhookSecret,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Stripe connection failed",
    };
  }
}
