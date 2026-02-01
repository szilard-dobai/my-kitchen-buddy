import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSession, mockTelegramLink } from "../../mocks/fixtures";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/telegram", () => ({
  signLinkToken: vi.fn(),
}));

vi.mock("@/models/telegram-link", () => ({
  getTelegramLinkByUserId: vi.fn(),
  deleteTelegramLink: vi.fn(),
}));

describe("/api/telegram-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/telegram-link/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns linked:false when no link exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { getTelegramLinkByUserId } = await import("@/models/telegram-link");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getTelegramLinkByUserId).mockResolvedValueOnce(null);

      const { GET } = await import("@/app/api/telegram-link/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.linked).toBe(false);
    });

    it("returns linked:true with details when link exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { getTelegramLinkByUserId } = await import("@/models/telegram-link");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getTelegramLinkByUserId).mockResolvedValueOnce(mockTelegramLink);

      const { GET } = await import("@/app/api/telegram-link/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.linked).toBe(true);
      expect(data.telegramUsername).toBe(mockTelegramLink.telegramUsername);
      expect(data.telegramFirstName).toBe(mockTelegramLink.telegramFirstName);
      expect(data.linkedAt).toBeDefined();
    });
  });

  describe("POST", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/telegram-link/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 400 when user already linked", async () => {
      const { getSession } = await import("@/lib/session");
      const { getTelegramLinkByUserId } = await import("@/models/telegram-link");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getTelegramLinkByUserId).mockResolvedValueOnce(mockTelegramLink);

      const { POST } = await import("@/app/api/telegram-link/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Telegram account already linked");
    });

    it("returns deepLink and token for unlinked user", async () => {
      const { getSession } = await import("@/lib/session");
      const { getTelegramLinkByUserId } = await import("@/models/telegram-link");
      const { signLinkToken } = await import("@/lib/telegram");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(getTelegramLinkByUserId).mockResolvedValueOnce(null);
      vi.mocked(signLinkToken).mockReturnValueOnce("test_token_123");

      const { POST } = await import("@/app/api/telegram-link/route");
      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBe("test_token_123");
      expect(data.deepLink).toContain("t.me/");
      expect(data.deepLink).toContain("test_token_123");
      expect(signLinkToken).toHaveBeenCalledWith(mockSession.user.id);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not authenticated", async () => {
      const { getSession } = await import("@/lib/session");
      vi.mocked(getSession).mockResolvedValueOnce(null);

      const { DELETE } = await import("@/app/api/telegram-link/route");
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 404 when no link exists", async () => {
      const { getSession } = await import("@/lib/session");
      const { deleteTelegramLink } = await import("@/models/telegram-link");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(deleteTelegramLink).mockResolvedValueOnce(false);

      const { DELETE } = await import("@/app/api/telegram-link/route");
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("No linked Telegram account found");
    });

    it("removes link successfully", async () => {
      const { getSession } = await import("@/lib/session");
      const { deleteTelegramLink } = await import("@/models/telegram-link");

      vi.mocked(getSession).mockResolvedValueOnce(mockSession);
      vi.mocked(deleteTelegramLink).mockResolvedValueOnce(true);

      const { DELETE } = await import("@/app/api/telegram-link/route");
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteTelegramLink).toHaveBeenCalledWith(mockSession.user.id);
    });
  });
});
