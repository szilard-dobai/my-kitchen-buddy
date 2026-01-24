import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractionStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

interface ExtractionProgressProps {
  progress: number;
  currentStep: string;
  steps: ExtractionStep[];
  className?: string;
}

export function ExtractionProgress({
  progress,
  currentStep,
  steps,
  className,
}: ExtractionProgressProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 card-shadow", className)}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{currentStep}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full progress-gradient transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
            ) : step.status === "active" ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            )}
            <span
              className={cn(
                "text-sm",
                step.status === "completed" && "text-muted-foreground line-through",
                step.status === "active" && "font-medium text-foreground",
                step.status === "pending" && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
