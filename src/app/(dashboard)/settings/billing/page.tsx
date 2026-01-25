"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UsageInfo } from "@/types/subscription";

function BillingContent() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const response = await fetch("/api/billing/usage");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(priceType: "monthly" | "yearly") {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setActionLoading(false);
    }
  }

  async function handleManageBilling() {
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open portal");
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Billing</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPro = usage?.planTier === "pro";
  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Successfully upgraded to Pro! Your extraction limit has been
          increased.
        </div>
      )}

      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>{isPro ? "Pro Plan" : "Free Plan"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Extractions this month</span>
              <span>
                {usage?.used} / {usage?.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usagePercent >= 80 ? "bg-orange-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {usage?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Resets on {new Date(usage.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {isPro && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={actionLoading}
            >
              {actionLoading ? "Loading..." : "Manage Subscription"}
            </Button>
          )}
        </CardContent>
      </Card>

      {!isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Get 100 recipe extractions per month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-2xl font-bold">$5/mo</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Billed monthly
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade("monthly")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Loading..." : "Subscribe Monthly"}
                </Button>
              </div>
              <div className="border rounded-lg p-4 border-primary">
                <h3 className="font-semibold">Yearly</h3>
                <p className="text-2xl font-bold">
                  $50/yr{" "}
                  <span className="text-sm font-normal text-green-600">
                    Save $10
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Billed annually
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade("yearly")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Loading..." : "Subscribe Yearly"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Billing</h1>
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
