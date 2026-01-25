import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { signLinkToken } from "@/lib/telegram";
import {
  deleteTelegramLink,
  getTelegramLinkByUserId,
} from "@/models/telegram-link";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const link = await getTelegramLinkByUserId(session.user.id);

    if (!link) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      telegramUsername: link.telegramUsername,
      telegramFirstName: link.telegramFirstName,
      linkedAt: link.linkedAt,
    });
  } catch (error) {
    console.error("Error checking telegram link:", error);
    return NextResponse.json(
      { error: "Failed to check link status" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLink = await getTelegramLinkByUserId(session.user.id);
    if (existingLink) {
      return NextResponse.json(
        { error: "Telegram account already linked" },
        { status: 400 },
      );
    }

    const token = signLinkToken(session.user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "YourBot";
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({ deepLink, token });
  } catch (error) {
    console.error("Error generating link token:", error);
    return NextResponse.json(
      { error: "Failed to generate link" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteTelegramLink(session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "No linked Telegram account found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking telegram:", error);
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 },
    );
  }
}
