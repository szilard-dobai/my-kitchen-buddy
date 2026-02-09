import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
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

const STORAGE_KEY = "mkb_lapsed_modal_shown";

describe("LapsedUserModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it("renders modal when not previously shown", async () => {
    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.getByText(/your pro subscription has ended/i),
      ).toBeInTheDocument();
    });
  });

  it("does not render when modal was previously shown", async () => {
    localStorage.setItem(STORAGE_KEY, "true");

    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.queryByText(/your pro subscription has ended/i),
      ).not.toBeInTheDocument();
    });
  });

  it("tracks lapsed_modal_shown event when displayed", async () => {
    const { trackEvent } = await import("@/lib/tracking");

    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("lapsed_modal_shown");
    });
  });

  it("closes modal and marks as seen when Continue on Free is clicked", async () => {
    const user = userEvent.setup();

    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.getByText(/your pro subscription has ended/i),
      ).toBeInTheDocument();
    });

    const continueButton = screen.getByRole("button", {
      name: /continue on free/i,
    });
    await user.click(continueButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/your pro subscription has ended/i),
      ).not.toBeInTheDocument();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("tracks lapsed_modal_cta_click when re-subscribe is clicked", async () => {
    const user = userEvent.setup();
    const { trackEvent } = await import("@/lib/tracking");

    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.getByText(/your pro subscription has ended/i),
      ).toBeInTheDocument();
    });

    const resubscribeLink = screen.getByRole("link", {
      name: /re-subscribe to pro/i,
    });
    await user.click(resubscribeLink);

    expect(trackEvent).toHaveBeenCalledWith("lapsed_modal_cta_click");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("links to billing settings", async () => {
    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.getByText(/your pro subscription has ended/i),
      ).toBeInTheDocument();
    });

    const resubscribeLink = screen.getByRole("link", {
      name: /re-subscribe to pro/i,
    });
    expect(resubscribeLink).toHaveAttribute("href", "/settings?tab=billing");
  });

  it("shows reassuring message about data safety", async () => {
    const { LapsedUserModal } =
      await import("@/components/upgrade/lapsed-user-modal");
    render(<LapsedUserModal />);

    await waitFor(() => {
      expect(
        screen.getByText(/all your recipes, collections, and tags are safe/i),
      ).toBeInTheDocument();
    });
  });
});
