import { ChefHat } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface FooterProps {
  compact?: boolean;
}

export function Footer({ compact = false }: FooterProps) {
  if (compact) {
    return (
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>
              <span>© {new Date().getFullYear()} My Kitchen Buddy</span>
              <span className="mx-2">·</span>
              <span className="font-mono">
                Built by{" "}
                <a
                  href="https://www.linkedin.com/in/szilard-dobai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity underline"
                >
                  Szilard Dobai
                </a>
              </span>
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">My Kitchen Buddy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Transform cooking videos from TikTok, Instagram, and YouTube into
              structured, easy-to-follow recipes with AI.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/extract"
                  className="hover:text-foreground transition-colors"
                >
                  Extract Recipe
                </Link>
              </li>
              <li>
                <Link
                  href="/recipes"
                  className="hover:text-foreground transition-colors"
                >
                  My Recipes
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/telegram"
                  className="hover:text-foreground transition-colors"
                >
                  Telegram Bot
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} My Kitchen Buddy</span>
            <span className="mx-2">·</span>
            <span className="font-mono">
              Built by{" "}
              <a
                href="https://www.linkedin.com/in/szilard-dobai/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity underline"
              >
                Szilard Dobai
              </a>
            </span>
          </p>

          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
