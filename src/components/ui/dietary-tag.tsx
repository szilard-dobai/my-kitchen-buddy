import { Leaf, Carrot, Wheat, Milk, Flame, Fish, Nut, Egg, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietaryTagProps {
  tag: string;
  className?: string;
}

const tagConfig: Record<string, { icon: LucideIcon; colorClass: string }> = {
  vegan: { icon: Leaf, colorClass: "bg-green-100 text-green-700" },
  vegetarian: { icon: Carrot, colorClass: "bg-orange-100 text-orange-700" },
  "gluten-free": { icon: Wheat, colorClass: "bg-amber-100 text-amber-700" },
  "dairy-free": { icon: Milk, colorClass: "bg-blue-100 text-blue-700" },
  keto: { icon: Flame, colorClass: "bg-red-100 text-red-700" },
  pescatarian: { icon: Fish, colorClass: "bg-cyan-100 text-cyan-700" },
  "nut-free": { icon: Nut, colorClass: "bg-yellow-100 text-yellow-700" },
  "egg-free": { icon: Egg, colorClass: "bg-pink-100 text-pink-700" },
  paleo: { icon: Leaf, colorClass: "bg-emerald-100 text-emerald-700" },
  "low-carb": { icon: Wheat, colorClass: "bg-purple-100 text-purple-700" },
};

export function DietaryTag({ tag, className }: DietaryTagProps) {
  const normalizedTag = tag.toLowerCase();
  const config = tagConfig[normalizedTag];

  const Icon = config?.icon;
  const colorClass = config?.colorClass || "bg-secondary text-secondary-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        colorClass,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {tag}
    </span>
  );
}
