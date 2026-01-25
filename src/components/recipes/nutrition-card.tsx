"use client";

import { Apple, Beef, Cookie, Droplet, Flame, Pill, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { NutritionInfo } from "@/types/recipe";

type NutritionValues = NonNullable<NutritionInfo["perServing"]>;

interface NutritionCardProps {
  nutrition?: NutritionInfo;
  className?: string;
}

const nutritionItems = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    icon: Flame,
    colorClass: "bg-nutrition-calories",
  },
  {
    key: "protein",
    label: "Protein",
    unit: "g",
    icon: Beef,
    colorClass: "bg-nutrition-protein",
  },
  {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    icon: Wheat,
    colorClass: "bg-nutrition-carbs",
  },
  {
    key: "fat",
    label: "Fat",
    unit: "g",
    icon: Droplet,
    colorClass: "bg-nutrition-fat",
  },
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    icon: Apple,
    colorClass: "bg-nutrition-fiber",
  },
  {
    key: "sugar",
    label: "Sugar",
    unit: "g",
    icon: Cookie,
    colorClass: "bg-nutrition-sugar",
  },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    icon: Pill,
    colorClass: "bg-nutrition-sodium",
  },
] as const;

function hasAnyNutritionValue(data: NutritionValues | undefined): boolean {
  if (!data) return false;
  return nutritionItems.some((item) => !!data[item.key]);
}

export function NutritionCard({ nutrition, className }: NutritionCardProps) {
  const hasPerServing = useMemo(
    () => hasAnyNutritionValue(nutrition?.perServing),
    [nutrition?.perServing],
  );
  const hasPer100g = useMemo(
    () => hasAnyNutritionValue(nutrition?.per100g),
    [nutrition?.per100g],
  );

  const [activeTab, setActiveTab] = useState<"perServing" | "per100g">(
    hasPerServing ? "perServing" : "per100g",
  );

  const data =
    activeTab === "perServing" ? nutrition?.perServing : nutrition?.per100g;
  const showSwitcher = hasPerServing && hasPer100g;

  if (!hasPerServing && !hasPer100g) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-card p-4 card-shadow", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Nutrition Facts</h3>
        {showSwitcher && (
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab("perServing")}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                activeTab === "perServing"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Per Serving
            </button>
            <button
              onClick={() => setActiveTab("per100g")}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                activeTab === "per100g"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Per 100g
            </button>
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nutritionItems.map((item) => {
            const value = data[item.key as keyof NutritionValues];
            if (!value) return null;

            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg p-3 text-white",
                  item.colorClass,
                  item.key === "calories" && "col-span-2 sm:col-span-1",
                )}
              >
                <Icon className="h-5 w-5 mb-1 opacity-80" />
                <span className="text-xl font-bold">{value}</span>
                <span className="text-xs opacity-80">{item.unit}</span>
                <span className="text-xs font-medium mt-0.5">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
