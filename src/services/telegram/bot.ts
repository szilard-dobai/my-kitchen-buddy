import type { Context } from "grammy";
import { getBot, verifyLinkToken } from "@/lib/telegram";
import { createExtractionJob } from "@/models/extraction-job";
import { findRecipeBySourceUrl } from "@/models/recipe";
import {
  createTelegramLink,
  getTelegramLinkByTelegramUserId,
  updateTelegramLinkLanguage,
} from "@/models/telegram-link";
import {
  detectPlatform,
  normalizeUrl,
} from "@/services/extraction/platform-detector";
import type { TargetLanguage } from "@/types/extraction-job";
import { sendRecipePreview } from "./notifications";

async function triggerJobProcessing(jobId: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = process.env.INTERNAL_API_TOKEN;

  fetch(`${appUrl}/api/jobs/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ jobId }),
  }).catch((error) => {
    console.error("Failed to trigger job processing:", error);
  });
}

export function setupBotHandlers(): void {
  const bot = getBot();

  bot.command("start", handleStart);
  bot.command("help", handleHelp);
  bot.command("lang", handleLang);
  bot.on("message:text", handleMessage);
}

async function handleStart(ctx: Context): Promise<void> {
  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length > 1) {
    const token = parts[1];
    const payload = verifyLinkToken(token);

    if (!payload) {
      await ctx.reply(
        "This link has expired or is invalid. Please generate a new one from the app settings."
      );
      return;
    }

    const existingLink = await getTelegramLinkByTelegramUserId(
      ctx.from?.id || 0
    );
    if (existingLink) {
      await ctx.reply(
        "Your Telegram account is already linked to a My Kitchen Buddy account."
      );
      return;
    }

    await createTelegramLink({
      userId: payload.userId,
      telegramUserId: ctx.from?.id || 0,
      telegramUsername: ctx.from?.username,
      telegramFirstName: ctx.from?.first_name || "User",
    });

    await ctx.reply(
      "Account linked successfully! You can now send video URLs to extract recipes."
    );
    return;
  }

  await ctx.reply(
    "Welcome to My Kitchen Buddy!\n\n" +
      "Send me a TikTok, Instagram, or YouTube video URL and I'll extract the recipe for you.\n\n" +
      "To get started, link your account from the app settings page."
  );
}

async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    "My Kitchen Buddy Bot\n\n" +
      "Send me a video URL from:\n" +
      "- TikTok\n" +
      "- Instagram Reels\n" +
      "- YouTube / Shorts\n\n" +
      "I'll extract the recipe and send you a link to view and edit it.\n\n" +
      "Commands:\n" +
      "/lang - Set output language (original or English)\n" +
      "/help - Show this help message\n\n" +
      "Make sure your account is linked in the app settings first."
  );
}

async function handleLang(ctx: Context): Promise<void> {
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) return;

  const link = await getTelegramLinkByTelegramUserId(telegramUserId);
  if (!link) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await ctx.reply(
      `Your Telegram account is not linked. Please link it first:\n${appUrl}/settings/telegram`
    );
    return;
  }

  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length < 2) {
    const currentLang = link.preferredLanguage === "en" ? "English" : "Original";
    await ctx.reply(
      `Current language: ${currentLang}\n\n` +
        "Usage:\n" +
        "/lang original - Keep the source language\n" +
        "/lang en - Translate to English"
    );
    return;
  }

  const langArg = parts[1].toLowerCase();
  let newLang: TargetLanguage;

  if (langArg === "en" || langArg === "english") {
    newLang = "en";
  } else if (langArg === "original" || langArg === "orig") {
    newLang = "original";
  } else {
    await ctx.reply(
      "Invalid language. Use:\n" +
        "/lang original - Keep the source language\n" +
        "/lang en - Translate to English"
    );
    return;
  }

  await updateTelegramLinkLanguage(telegramUserId, newLang);
  const langName = newLang === "en" ? "English" : "Original (source language)";
  await ctx.reply(`Language set to: ${langName}`);
}

async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const urlMatch = text.match(
    /https?:\/\/[^\s]+/
  );
  if (!urlMatch) {
    await ctx.reply(
      "Please send a valid video URL from TikTok, Instagram, or YouTube."
    );
    return;
  }

  const url = urlMatch[0];
  const telegramUserId = ctx.from?.id;
  if (!telegramUserId) return;

  const link = await getTelegramLinkByTelegramUserId(telegramUserId);
  if (!link) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await ctx.reply(
      `Your Telegram account is not linked. Please link it first:\n${appUrl}/settings/telegram`
    );
    return;
  }

  const normalizedUrl = normalizeUrl(url);
  const detection = detectPlatform(normalizedUrl);

  if (!detection.isValid) {
    await ctx.reply(
      detection.error ||
        "This URL is not supported. Please send a TikTok, Instagram, or YouTube video."
    );
    return;
  }

  const existingRecipe = await findRecipeBySourceUrl(link.userId, normalizedUrl);
  if (existingRecipe) {
    await sendRecipePreview(ctx.chat?.id || 0, existingRecipe);
    return;
  }

  const job = await createExtractionJob({
    userId: link.userId,
    sourceUrl: normalizedUrl,
    normalizedUrl,
    platform: detection.platform,
    telegramChatId: ctx.chat?.id,
    targetLanguage: link.preferredLanguage,
  });

  await ctx.reply("Starting extraction... This may take a few minutes.");

  await triggerJobProcessing(job.id);
}
