import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

vi.mock("@/lib/db", () => ({
  default: vi.fn().mockResolvedValue({
    command: vi.fn().mockResolvedValue({ ok: 1 }),
  }),
}));

describe("/api/health", () => {
  it("returns healthy status when database is connected", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.services.mongodb).toBe("connected");
    expect(data.timestamp).toBeDefined();
    expect(data.responseTime).toBeDefined();
  });

  it("returns unhealthy status when database fails", async () => {
    const getDb = await import("@/lib/db");
    vi.mocked(getDb.default).mockRejectedValueOnce(
      new Error("Connection failed"),
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.services.mongodb).toBe("disconnected");
    expect(data.error).toBe("Connection failed");
  });
});
