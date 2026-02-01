import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
    },
    refetch: vi.fn(),
  }),
  authClient: {
    updateUser: vi.fn(),
    changePassword: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Profile Tab", () => {
    it("renders name and email fields", async () => {
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it("enables save button when name changed", async () => {
      const user = userEvent.setup();
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "New Name");

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it("shows delete account button", async () => {
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete account/i }),
        ).toBeInTheDocument();
      });
    });

    it("opens delete account dialog", async () => {
      const user = userEvent.setup();
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /delete account/i }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /delete account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/this action cannot be undone/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Telegram Tab", () => {
    it("renders telegram tab button", async () => {
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      expect(
        screen.getByRole("tab", { name: /telegram/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Billing Tab", () => {
    it("renders billing tab button", async () => {
      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      expect(screen.getByRole("tab", { name: /billing/i })).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("tracks settings_view event on mount", async () => {
      const { trackEvent } = await import("@/lib/tracking");

      const SettingsPage = (await import("@/app/(dashboard)/settings/page"))
        .default;
      render(<SettingsPage />);

      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith("settings_view", {
          tab: "profile",
        });
      });
    });
  });
});
