import { User } from "lucide-react";

export function SimilarRecipePlaceholder() {
  return (
    <div className="shrink-0 w-40 snap-start">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        <div className="absolute inset-0 backdrop-blur-md bg-muted/50" />
        <div className="absolute top-2 right-2 size-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
          <User className="size-3.5 text-muted-foreground/50" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1.5">
          <div className="h-3 bg-muted-foreground/20 rounded-full w-full" />
          <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
}
