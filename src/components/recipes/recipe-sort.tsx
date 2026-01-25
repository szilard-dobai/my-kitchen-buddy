"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOption } from "@/lib/recipe-filters";

interface RecipeSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  hasSearch: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "A-Z" },
];

export function RecipeSort({ value, onChange, hasSearch }: RecipeSortProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.value === "relevance" && !hasSearch}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
