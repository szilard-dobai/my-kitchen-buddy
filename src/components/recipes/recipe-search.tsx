"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RecipeSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RecipeSearch({ value, onChange, className }: RecipeSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder="Search by title, creator, or ingredient..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
