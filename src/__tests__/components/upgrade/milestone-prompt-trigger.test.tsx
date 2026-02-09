import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MilestonePromptTrigger } from "@/components/upgrade/milestone-prompt-trigger";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("MilestonePromptTrigger", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows milestone prompt when user crosses threshold", () => {
    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    expect(
      screen.getByText("You're building a collection!"),
    ).toBeInTheDocument();
  });

  it("does not show prompt for pro users", () => {
    render(<MilestonePromptTrigger recipeCount={5} planTier="pro" />);

    expect(
      screen.queryByText("You're building a collection!"),
    ).not.toBeInTheDocument();
  });

  it("does not show prompt when below milestone", () => {
    render(<MilestonePromptTrigger recipeCount={3} planTier="free" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show prompt when milestone already seen", () => {
    localStorage.setItem("mkb_seen_milestones", JSON.stringify([5]));

    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    expect(
      screen.queryByText("You're building a collection!"),
    ).not.toBeInTheDocument();
  });

  it("marks milestone as seen when dismissed", async () => {
    const user = userEvent.setup();

    render(<MilestonePromptTrigger recipeCount={5} planTier="free" />);

    await user.click(screen.getByText("Got it!"));

    const stored = localStorage.getItem("mkb_seen_milestones");
    expect(JSON.parse(stored!)).toContain(5);
  });

  it("shows upgrade CTA for non-celebratory milestones", () => {
    localStorage.setItem("mkb_seen_milestones", JSON.stringify([5]));

    render(<MilestonePromptTrigger recipeCount={10} planTier="free" />);

    expect(screen.getByText("10 recipes saved!")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    expect(screen.getByText("Maybe Later")).toBeInTheDocument();
  });

  it("shows lowest unseen milestone first", () => {
    render(<MilestonePromptTrigger recipeCount={30} planTier="free" />);

    expect(
      screen.getByText("You're building a collection!"),
    ).toBeInTheDocument();
  });
});
