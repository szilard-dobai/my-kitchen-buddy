import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telegram Bot Settings",
  description:
    "Connect your Telegram account to extract recipes by sending video links directly to the bot.",
};

export default function TelegramSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
