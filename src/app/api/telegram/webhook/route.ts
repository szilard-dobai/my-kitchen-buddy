import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram";
import { setupBotHandlers } from "@/services/telegram/bot";

let initialized = false;

function initBot() {
  if (initialized) return;
  setupBotHandlers();
  initialized = true;
}

export async function POST(request: Request) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (expectedSecret && secretToken !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  initBot();
  const bot = getBot();
  const handler = webhookCallback(bot, "std/http");

  return handler(request);
}
