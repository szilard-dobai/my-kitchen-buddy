import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/upgrade-prompts", () => ({
  isPromptDismissed: vi.fn(),
  dismissPrompt: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("LapsedUserBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("renders when prompt is not dismissed", async () => {
    const { isPromptDismissed } = await import("@/lib/upgrade-prompts");
    vi.mocked(isPromptDismissed).mockReturnValue(false);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    expect(
      screen.getByText(/your pro subscription has ended/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /re-subscribe/i }),
    ).toBeInTheDocument();
  });

  it("does not render when prompt is dismissed", async () => {
    const { isPromptDismissed } = await import("@/lib/upgrade-prompts");
    vi.mocked(isPromptDismissed).mockReturnValue(true);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    expect(
      screen.queryByText(/your pro subscription has ended/i),
    ).not.toBeInTheDocument();
  });

  it("tracks lapsed_banner_shown event when displayed", async () => {
    const { isPromptDismissed } = await import("@/lib/upgrade-prompts");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(isPromptDismissed).mockReturnValue(false);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    expect(trackEvent).toHaveBeenCalledWith("lapsed_banner_shown");
  });

  it("dismisses banner and tracks event on close", async () => {
    const user = userEvent.setup();
    const { isPromptDismissed, dismissPrompt } = await import(
      "@/lib/upgrade-prompts"
    );
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(isPromptDismissed).mockReturnValue(false);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);

    expect(trackEvent).toHaveBeenCalledWith("lapsed_banner_dismissed");
    expect(dismissPrompt).toHaveBeenCalledWith("lapsed_resubscribe");
  });

  it("tracks lapsed_banner_cta_click when re-subscribe is clicked", async () => {
    const user = userEvent.setup();
    const { isPromptDismissed } = await import("@/lib/upgrade-prompts");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(isPromptDismissed).mockReturnValue(false);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    const resubscribeLink = screen.getByRole("link", { name: /re-subscribe/i });
    await user.click(resubscribeLink);

    expect(trackEvent).toHaveBeenCalledWith("lapsed_banner_cta_click");
  });

  it("links to billing settings", async () => {
    const { isPromptDismissed } = await import("@/lib/upgrade-prompts");
    vi.mocked(isPromptDismissed).mockReturnValue(false);

    const { LapsedUserBanner } = await import(
      "@/components/upgrade/lapsed-user-banner"
    );
    render(<LapsedUserBanner />);

    const resubscribeLink = screen.getByRole("link", { name: /re-subscribe/i });
    expect(resubscribeLink).toHaveAttribute("href", "/settings?tab=billing");
  });
});
