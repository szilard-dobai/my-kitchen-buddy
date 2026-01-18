"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LinkStatus {
  linked: boolean;
  telegramUsername?: string;
  telegramFirstName?: string;
  linkedAt?: string;
}

export default function TelegramSettingsPage() {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [deepLink, setDeepLink] = useState<string | null>(null);

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
    setActionLoading(true);
    setError("");
    setDeepLink(null);

    try {
      const response = await fetch("/api/telegram-link", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate link");
      }

      setDeepLink(data.deepLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Telegram Settings</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Telegram Settings</h1>

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
              {deepLink ? (
                <>
                  <p className="text-sm text-gray-600">
                    Click the link below to open Telegram and complete the
                    linking process. Press &quot;Start&quot; when the bot opens.
                  </p>
                  <Button asChild>
                    <a href={deepLink} target="_blank" rel="noopener noreferrer">
                      Open Telegram Bot
                    </a>
                  </Button>
                  <p className="text-xs text-gray-500">
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
                  <p className="text-sm text-gray-600">
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

      <div className="mt-8 text-sm text-gray-500">
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
