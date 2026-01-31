import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
}));

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", async () => {
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in button", async () => {
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders Google and Apple OAuth buttons", async () => {
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });

  it("renders link to register page", async () => {
    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute("href", "/register");
  });

  it("submits form and redirects on successful email login", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(signIn.email).mockResolvedValueOnce({ data: { user: {} }, error: null } as never);

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/recipes");
    });

    expect(trackEvent).toHaveBeenCalledWith("login_attempt", {
      provider: "email",
      success: true,
    });
  });

  it("displays error message on invalid credentials", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");

    vi.mocked(signIn.email).mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid email or password" },
    } as never);

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("displays error message on unexpected error", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");

    vi.mocked(signIn.email).mockRejectedValueOnce(new Error("Network error"));

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");

    vi.mocked(signIn.email).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null } as never), 100)),
    );

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();
  });

  it("triggers Google OAuth flow on button click", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(signIn.social).mockResolvedValueOnce({} as never);

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/recipes",
    });
    expect(trackEvent).toHaveBeenCalledWith("login_attempt", { provider: "google" });
  });

  it("triggers Apple OAuth flow on button click", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(signIn.social).mockResolvedValueOnce({} as never);

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /apple/i }));

    expect(signIn.social).toHaveBeenCalledWith({
      provider: "apple",
      callbackURL: "/recipes",
    });
    expect(trackEvent).toHaveBeenCalledWith("login_attempt", { provider: "apple" });
  });

  it("tracks login_view event on mount", async () => {
    const { trackEvent } = await import("@/lib/tracking");

    const LoginPage = (await import("@/app/(auth)/login/page")).default;
    render(<LoginPage />);

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("login_view");
    });
  });
});
