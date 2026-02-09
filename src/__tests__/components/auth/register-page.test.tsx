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
  signUp: {
    email: vi.fn(),
  },
  signIn: {
    social: vi.fn(),
  },
}));

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all registration fields", async () => {
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders create account button", async () => {
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("renders OAuth buttons", async () => {
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });

  it("renders link to login page", async () => {
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("validates passwords match", async () => {
    const user = userEvent.setup();
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "differentpassword",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("validates minimum password length", async () => {
    const user = userEvent.setup();
    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("submits form and redirects on successful registration", async () => {
    const user = userEvent.setup();
    const { signUp } = await import("@/lib/auth-client");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(signUp.email).mockResolvedValueOnce({
      data: { user: {} },
      error: null,
    } as never);

    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(signUp.email).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/recipes");
    });

    expect(trackEvent).toHaveBeenCalledWith("register_attempt", {
      provider: "email",
      success: true,
    });
  });

  it("displays error on registration failure", async () => {
    const user = userEvent.setup();
    const { signUp } = await import("@/lib/auth-client");

    vi.mocked(signUp.email).mockResolvedValueOnce({
      data: null,
      error: { message: "Email already exists" },
    } as never);

    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("triggers Google OAuth flow on button click", async () => {
    const user = userEvent.setup();
    const { signIn } = await import("@/lib/auth-client");
    const { trackEvent } = await import("@/lib/tracking");

    vi.mocked(signIn.social).mockResolvedValueOnce({} as never);

    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/recipes",
    });
    expect(trackEvent).toHaveBeenCalledWith("register_attempt", {
      provider: "google",
    });
  });

  it("tracks register_view event on mount", async () => {
    const { trackEvent } = await import("@/lib/tracking");

    const RegisterPage = (await import("@/app/(auth)/register/page")).default;
    render(<RegisterPage />);

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith("register_view");
    });
  });
});
