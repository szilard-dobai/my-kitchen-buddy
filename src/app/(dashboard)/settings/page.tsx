"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { trackEvent } from "@/lib/tracking";
import type { UsageInfo } from "@/types/subscription";

function ProfileTab() {
  const { data: session } = useSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            defaultValue={session?.user?.name || ""}
            disabled
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue={session?.user?.email || ""}
            disabled
            placeholder="Your email"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Profile editing coming soon.
        </p>
      </CardContent>
    </Card>
  );
}

function TelegramTab() {
  const [status, setStatus] = useState<{
    linked: boolean;
    telegramUsername?: string;
    telegramFirstName?: string;
    linkedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch("/api/telegram-link");
      const data = await response.json();
      setStatus(data);
    } catch {
      setError("Failed to load status");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    trackEvent("telegram_connect_click");
    setActionLoading(true);
    setError("");
    setDeepLink(null);
    setToken(null);
    setCopied(false);

    try {
      const response = await fetch("/api/telegram-link", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate link");
      }

      setDeepLink(data.deepLink);
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setActionLoading(false);
    }
  }

  async function copyCommand() {
    if (!token) return;
    const command = `/start ${token}`;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDisconnect() {
    trackEvent("telegram_disconnect_click");
    setActionLoading(true);
    setError("");

    try {
      const response = await fetch("/api/telegram-link", { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      setStatus({ linked: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Bot</CardTitle>
          <CardDescription>
            Connect your Telegram account to extract recipes by sharing video
            URLs directly to the bot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {status?.linked ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-green-800 font-medium">Connected</p>
                <p className="text-green-700 text-sm mt-1">
                  Linked to{" "}
                  {status.telegramUsername
                    ? `@${status.telegramUsername}`
                    : status.telegramFirstName}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={actionLoading}
              >
                {actionLoading ? "Disconnecting..." : "Disconnect Telegram"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {deepLink && token ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Click the link below to open Telegram and complete the
                    linking process.
                  </p>
                  <Button asChild>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Telegram Bot
                    </a>
                  </Button>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      If the link doesn&apos;t work, copy this command and paste
                      it in the bot chat:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                        /start {token}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyCommand}>
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Link expires in 10 minutes.{" "}
                    <button
                      onClick={handleConnect}
                      className="text-blue-600 hover:underline"
                    >
                      Generate new link
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to generate a link to connect your
                    Telegram account.
                  </p>
                  <Button onClick={handleConnect} disabled={actionLoading}>
                    {actionLoading ? "Generating..." : "Connect Telegram"}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">How it works:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click &quot;Connect Telegram&quot; to open the bot</li>
          <li>Press &quot;Start&quot; in Telegram to complete linking</li>
          <li>Share any TikTok, Instagram, or YouTube URL to the bot</li>
          <li>
            The bot will extract the recipe and send you a link to view it
          </li>
        </ol>
      </div>
    </div>
  );
}

function BillingTab() {
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );

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
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const isPro = usage?.planTier === "pro";
  const usagePercent = usage ? Math.round((usage.used / usage.limit) * 100) : 0;

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Successfully upgraded to Pro! Your extraction limit has been
          increased.
        </div>
      )}

      {canceled && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          Checkout was canceled. You can try again anytime.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <Card>
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
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>
                  <strong>100 extractions/month</strong> (vs {usage?.limit} on
                  Free)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>more coming soon</span>
              </li>
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan("monthly");
                  trackEvent("plan_card_click", { plan: "monthly" });
                }}
                className={`border-2 rounded-lg p-4 text-left cursor-pointer transition-colors ${
                  selectedPlan === "monthly"
                    ? "border-orange-500 bg-orange-50"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-2xl font-bold">$5/mo</p>
                <p className="text-sm text-muted-foreground">Billed monthly</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan("yearly");
                  trackEvent("plan_card_click", { plan: "yearly" });
                }}
                className={`border-2 rounded-lg p-4 text-left cursor-pointer transition-colors ${
                  selectedPlan === "yearly"
                    ? "border-orange-500 bg-orange-50"
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <h3 className="font-semibold">Yearly</h3>
                <p className="text-2xl font-bold">
                  $50/yr{" "}
                  <span className="text-sm font-normal text-green-600">
                    Save $10
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Billed annually</p>
              </button>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                trackEvent("subscribe_click", { plan: selectedPlan });
                handleUpgrade(selectedPlan);
              }}
              disabled={actionLoading}
            >
              {actionLoading ? "Loading..." : "Upgrade to Pro"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = ["profile", "telegram", "billing"].includes(tabParam || "")
    ? tabParam!
    : "profile";
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent("settings_view", { tab: defaultTab });
      hasTrackedRef.current = true;
    }
  }, [defaultTab]);

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const queryString = params.toString();
    router.push(`/settings${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs value={defaultTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
