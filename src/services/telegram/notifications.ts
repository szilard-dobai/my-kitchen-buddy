import { getBot } from "@/lib/telegram";
import type { Recipe } from "@/types/recipe";

export async function sendStatusUpdate(
  chatId: number,
  message: string,
): Promise<void> {
  try {
    const bot = getBot();
    await bot.api.sendMessage(chatId, message);
  } catch (error) {
    console.error("Failed to send Telegram status update:", error);
  }
}

export async function sendRecipePreview(
  chatId: number,
  recipe: Recipe,
): Promise<void> {
  try {
    const bot = getBot();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const parts = ["Recipe extracted!\n"];

    parts.push(`*${escapeMarkdown(recipe.title)}*`);

    const meta: string[] = [];
    if (recipe.difficulty) meta.push(recipe.difficulty);
    if (recipe.totalTime) meta.push(recipe.totalTime);
    if (recipe.servings) meta.push(recipe.servings);
    if (meta.length > 0) {
      parts.push(meta.join(" · "));
    }

    parts.push("");
    parts.push(
      `${recipe.ingredients.length} ingredients · ${recipe.instructions.length} steps`,
    );

    parts.push("");
    parts.push(`[View recipe](${appUrl}/recipes/${recipe._id})`);

    await bot.api.sendMessage(chatId, parts.join("\n"), {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error("Failed to send recipe preview:", error);
  }
}

export async function sendError(chatId: number, error: string): Promise<void> {
  try {
    const bot = getBot();
    await bot.api.sendMessage(chatId, `Extraction failed: ${error}`);
  } catch (err) {
    console.error("Failed to send error message:", err);
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
