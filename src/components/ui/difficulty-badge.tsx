import { cn } from "@/lib/utils";

type Difficulty = "Easy" | "Medium" | "Hard";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const difficultyConfig: Record<Difficulty, { bgClass: string }> = {
  Easy: { bgClass: "bg-easy" },
  Medium: { bgClass: "bg-medium" },
  Hard: { bgClass: "bg-hard" },
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];

  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white",
        config.bgClass,
        className
      )}
    >
      {difficulty}
    </span>
  );
}
