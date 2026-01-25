"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

const THEME_CONFIG: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
  system: { icon: Monitor, label: "System" },
};

const emptySubscribe = () => () => {};

const useIsMounted = () => {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
};

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2" disabled>
        <Monitor className="size-4" />
        <span className="text-sm">System</span>
      </Button>
    );
  }

  const currentTheme = (theme as Theme) || "system";
  const config = THEME_CONFIG[currentTheme];
  const Icon = config.icon;

  const handleClick = () => {
    const currentIndex = THEME_CYCLE.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="gap-2"
      aria-label={`Current theme: ${config.label}. Click to change.`}
    >
      <Icon className="size-4" />
      <span className="text-sm">{config.label}</span>
    </Button>
  );
};
