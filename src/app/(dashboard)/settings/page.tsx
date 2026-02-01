"use client";

import { Check, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { DeleteTagDialog } from "@/components/tags/delete-tag-dialog";
import { EditTagDialog } from "@/components/tags/edit-tag-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTags } from "@/hooks/use-tags";
import { authClient, useSession } from "@/lib/auth-client";
import { trackEvent } from "@/lib/tracking";
import type { UsageInfo } from "@/types/subscription";
import type { Tag } from "@/types/tag";

function ProfileTab() {
  const router = useRouter();
  const { data: session, refetch } = useSession();

  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    async function checkAccountType() {
      try {
        const response = await fetch("/api/account");
        const data = await response.json();
        setHasPassword(data.hasPassword);
      } catch {
        setHasPassword(false);
      }
    }
    checkAccountType();
  }, []);

  async function handleNameSave() {
    if (!name.trim()) return;
    setNameLoading(true);
    setNameError("");
    setNameSuccess(false);

    try {
      const result = await authClient.updateUser({ name: name.trim() });
      if (result.error) {
        throw new Error(result.error.message || "Failed to update name");
      }
      await refetch();
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update name",
      );
    } finally {
      setNameLoading(false);
    }
  }

  async function handleEmailChange() {
    if (!newEmail.trim() || !emailPassword) return;
    setEmailLoading(true);
    setEmailError("");

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          currentPassword: emailPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update email");
      }
      await refetch();
      setEmailDialogOpen(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to update email",
      );
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to change password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "DELETE") return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }
      await authClient.signOut();
      router.push("/login");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account",
      );
      setDeleteLoading(false);
    }
  }

  const nameChanged = name.trim() !== (session?.user?.name || "");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {nameError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {nameError}
            </div>
          )}
          {nameSuccess && (
            <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
              Name updated successfully
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Button
                onClick={handleNameSave}
                disabled={nameLoading || !nameChanged}
              >
                {nameLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                placeholder="Your email"
              />
              {hasPassword && (
                <Dialog
                  open={emailDialogOpen}
                  onOpenChange={setEmailDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">Change</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Email</DialogTitle>
                      <DialogDescription>
                        Enter your new email and current password to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {emailError && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                          {emailError}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="new-email">New Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-password">Current Password</Label>
                        <Input
                          id="email-password"
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleEmailChange}
                        disabled={
                          emailLoading || !newEmail.trim() || !emailPassword
                        }
                      >
                        {emailLoading ? "Updating..." : "Update Email"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md">
                Password changed successfully
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={
                passwordLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and all associated data including recipes,
                  subscription, and Telegram link.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {deleteError && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                    {deleteError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">
                    Type <span className="font-mono font-bold">DELETE</span> to
                    confirm
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmation !== "DELETE"}
                >
                  {deleteLoading ? "Deleting..." : "Delete Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
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

function FeatureUsageRow({
  label,
  used,
  limit,
  atLimit,
}: {
  label: string;
  used: number;
  limit: number;
  atLimit: boolean;
}) {
  const isUnlimited = !Number.isFinite(limit);
  const percent = isUnlimited ? 0 : Math.round((used / limit) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span className={atLimit ? "text-orange-600 font-medium" : ""}>
          {used} / {isUnlimited ? "∞" : limit}
          {atLimit && !isUnlimited && " (maxed)"}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              atLimit
                ? "bg-orange-500"
                : percent >= 80
                  ? "bg-orange-500"
                  : "bg-primary"
            }`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function FeatureComparisonTable({ isPro }: { isPro: boolean }) {
  const features = [
    { name: "Recipe extractions", free: "10/month", pro: "100/month" },
    { name: "Collections", free: "3", pro: "Unlimited" },
    { name: "Custom tags", free: "5", pro: "Unlimited" },
    {
      name: "Bulk actions",
      free: "—",
      pro: <Check className="h-4 w-4 mx-auto text-green-600" />,
    },
    { name: "Similar recipes shown", free: "1", pro: "All" },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 font-medium">Feature</th>
            <th
              className={`text-center p-3 font-medium ${!isPro ? "bg-muted" : ""}`}
            >
              Free
            </th>
            <th
              className={`text-center p-3 font-medium ${isPro ? "bg-orange-50" : ""}`}
            >
              Pro
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-t">
              <td className="p-3">{feature.name}</td>
              <td
                className={`text-center p-3 text-muted-foreground ${!isPro ? "bg-muted/30" : ""}`}
              >
                {feature.free}
              </td>
              <td
                className={`text-center p-3 ${isPro ? "bg-orange-50/50 text-foreground font-medium" : ""}`}
              >
                {feature.pro}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const hasMaxedFeatures = usage?.features
    ? Object.values(usage.features).some(
        (f) => f.atLimit && Number.isFinite(f.limit),
      )
    : false;

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Successfully upgraded to Pro! Your limits have been removed.
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
        <CardContent className="space-y-6">
          {usage?.features && (
            <div className="space-y-4">
              <FeatureUsageRow
                label="Extractions this month"
                used={usage.features.extractions.used}
                limit={usage.features.extractions.limit}
                atLimit={usage.features.extractions.atLimit}
              />
              <FeatureUsageRow
                label="Collections"
                used={usage.features.collections.used}
                limit={usage.features.collections.limit}
                atLimit={usage.features.collections.atLimit}
              />
              <FeatureUsageRow
                label="Custom tags"
                used={usage.features.tags.used}
                limit={usage.features.tags.limit}
                atLimit={usage.features.tags.atLimit}
              />
            </div>
          )}

          {usage?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Extraction limit resets on{" "}
              {new Date(usage.currentPeriodEnd).toLocaleDateString()}
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

          {!isPro && hasMaxedFeatures && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
              You&apos;ve reached the limit on some features. Upgrade to Pro for
              unlimited access.
            </div>
          )}
        </CardContent>
      </Card>

      {!isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock unlimited collections, tags, and more extractions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
          <CardDescription>See what you get with each plan</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureComparisonTable isPro={isPro} />
        </CardContent>
      </Card>
    </div>
  );
}

function TagsTab() {
  const { data: tags = [], isLoading } = useTags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Manage your recipe tags. Tags help you categorize and find
                recipes.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="size-4 mr-1" />
              Create tag
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any tags yet.
              </p>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="size-4 mr-1" />
                Create your first tag
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">#{tag.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tag.recipeCount} recipe{tag.recipeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="size-8 flex items-center justify-center rounded hover:bg-accent cursor-pointer">
                        <MoreHorizontal className="size-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => setEditingTag(tag)}>
                        <Pencil className="size-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingTag(tag)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTagDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentCount={tags.length}
        planTier="free"
      />

      {editingTag && (
        <EditTagDialog
          open={!!editingTag}
          onOpenChange={(open) => !open && setEditingTag(null)}
          tag={editingTag}
        />
      )}

      {deletingTag && (
        <DeleteTagDialog
          open={!!deletingTag}
          onOpenChange={(open) => !open && setDeletingTag(null)}
          tag={deletingTag}
        />
      )}
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = ["profile", "telegram", "billing", "tags"].includes(
    tabParam || "",
  )
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
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="tags">
          <TagsTab />
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
