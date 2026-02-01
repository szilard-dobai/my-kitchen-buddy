import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExtractionProgress } from "@/components/recipes/extraction-progress";

describe("ExtractionProgress", () => {
  const mockSteps = [
    { id: "fetch", label: "Fetching video data", status: "completed" as const },
    { id: "analyze", label: "Analyzing recipe with AI", status: "active" as const },
    { id: "save", label: "Saving your recipe", status: "pending" as const },
  ];

  it("renders progress bar with correct percentage", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing recipe..."
        steps={mockSteps}
      />,
    );

    expect(screen.getByText("66%")).toBeInTheDocument();
  });

  it("renders current step message", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing recipe with AI..."
        steps={mockSteps}
      />,
    );

    expect(screen.getByText("Analyzing recipe with AI...")).toBeInTheDocument();
  });

  it("renders all extraction steps", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing..."
        steps={mockSteps}
      />,
    );

    expect(screen.getByText("Fetching video data")).toBeInTheDocument();
    expect(screen.getByText("Analyzing recipe with AI")).toBeInTheDocument();
    expect(screen.getByText("Saving your recipe")).toBeInTheDocument();
  });

  it("shows completed steps with strikethrough", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing..."
        steps={mockSteps}
      />,
    );

    const completedStep = screen.getByText("Fetching video data");
    expect(completedStep).toHaveClass("line-through");
  });

  it("shows active step with bold styling", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing..."
        steps={mockSteps}
      />,
    );

    const activeStep = screen.getByText("Analyzing recipe with AI");
    expect(activeStep).toHaveClass("font-medium");
  });

  it("shows pending steps with muted styling", () => {
    render(
      <ExtractionProgress
        progress={66}
        currentStep="Analyzing..."
        steps={mockSteps}
      />,
    );

    const pendingStep = screen.getByText("Saving your recipe");
    expect(pendingStep).toHaveClass("text-muted-foreground");
  });

  it("updates step statuses correctly as progress changes", () => {
    const allCompletedSteps = [
      { id: "fetch", label: "Fetching video data", status: "completed" as const },
      { id: "analyze", label: "Analyzing recipe with AI", status: "completed" as const },
      { id: "save", label: "Saving your recipe", status: "active" as const },
    ];

    render(
      <ExtractionProgress
        progress={90}
        currentStep="Saving your recipe..."
        steps={allCompletedSteps}
      />,
    );

    const fetchStep = screen.getByText("Fetching video data");
    const analyzeStep = screen.getByText("Analyzing recipe with AI");
    const saveStep = screen.getByText("Saving your recipe");

    expect(fetchStep).toHaveClass("line-through");
    expect(analyzeStep).toHaveClass("line-through");
    expect(saveStep).toHaveClass("font-medium");
  });

  it("renders at 0% progress for pending state", () => {
    const pendingSteps = [
      { id: "fetch", label: "Fetching video data", status: "active" as const },
      { id: "analyze", label: "Analyzing recipe with AI", status: "pending" as const },
      { id: "save", label: "Saving your recipe", status: "pending" as const },
    ];

    render(
      <ExtractionProgress
        progress={0}
        currentStep="Starting extraction..."
        steps={pendingSteps}
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders at 100% progress for completed state", () => {
    const completedSteps = [
      { id: "fetch", label: "Fetching video data", status: "completed" as const },
      { id: "analyze", label: "Analyzing recipe with AI", status: "completed" as const },
      { id: "save", label: "Saving your recipe", status: "completed" as const },
    ];

    render(
      <ExtractionProgress
        progress={100}
        currentStep="Complete!"
        steps={completedSteps}
      />,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
