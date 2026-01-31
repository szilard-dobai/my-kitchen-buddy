import { http, HttpResponse } from "msw";

import {
  mockCompletedJob,
  mockFreeUsageInfo,
  mockPendingJob,
  mockRecipe,
  mockRecipeList,
  mockTelegramLink,
} from "./fixtures";

export const handlers = [
  http.get("/api/health", () => {
    return HttpResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: { mongodb: "connected" },
      responseTime: "10ms",
    });
  }),

  http.get("/api/recipes", () => {
    return HttpResponse.json(mockRecipeList);
  }),

  http.get("/api/recipes/:id", ({ params }) => {
    const recipe = mockRecipeList.find((r) => r._id === params.id);
    if (!recipe) {
      return HttpResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return HttpResponse.json(recipe);
  }),

  http.put("/api/recipes/:id", async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockRecipe, ...body, _id: params.id });
  }),

  http.delete("/api/recipes/:id", () => {
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/extract", async ({ request }) => {
    const body = (await request.json()) as { url?: string };
    if (!body.url) {
      return HttpResponse.json(
        {
          error: "Validation failed",
          details: { url: ["Invalid URL format"] },
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      jobId: "job-123",
      status: "pending",
      message: "Extraction started",
    });
  }),

  http.get("/api/extract/:jobId", ({ params }) => {
    if (params.jobId === "job-completed") {
      return HttpResponse.json(mockCompletedJob);
    }
    return HttpResponse.json(mockPendingJob);
  }),

  http.get("/api/billing/usage", () => {
    return HttpResponse.json(mockFreeUsageInfo);
  }),

  http.post("/api/billing/checkout", async ({ request }) => {
    const body = (await request.json()) as { priceType?: string };
    if (!body.priceType || !["monthly", "yearly"].includes(body.priceType)) {
      return HttpResponse.json(
        { error: "Invalid price type" },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      url: "https://checkout.stripe.com/c/pay/test_session_123",
    });
  }),

  http.post("/api/billing/portal", () => {
    return HttpResponse.json({
      url: "https://billing.stripe.com/p/session/test_portal_123",
    });
  }),

  http.get("/api/telegram-link", () => {
    return HttpResponse.json({ linked: false });
  }),

  http.post("/api/telegram-link", () => {
    return HttpResponse.json({
      deepLink: "https://t.me/TestBot?start=token123",
      token: "token123",
    });
  }),

  http.delete("/api/telegram-link", () => {
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/refresh-author-avatar", () => {
    return HttpResponse.json({
      avatarUrl: "https://example.com/new-avatar.jpg",
    });
  }),

  http.post("/api/refresh-thumbnail", () => {
    return HttpResponse.json({
      thumbnailUrl: "https://example.com/new-thumbnail.jpg",
    });
  }),

  http.get("/api/account", () => {
    return HttpResponse.json({ hasPassword: true });
  }),

  http.patch("/api/account", () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete("/api/account/delete", () => {
    return HttpResponse.json({ success: true });
  }),
];

export const linkedTelegramHandler = http.get("/api/telegram-link", () => {
  return HttpResponse.json({
    linked: true,
    telegramUsername: mockTelegramLink.telegramUsername,
    telegramFirstName: mockTelegramLink.telegramFirstName,
    linkedAt: mockTelegramLink.linkedAt.toISOString(),
  });
});

export const proUsageHandler = http.get("/api/billing/usage", () => {
  return HttpResponse.json({
    used: 25,
    limit: 100,
    planTier: "pro",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

export const exhaustedUsageHandler = http.get("/api/billing/usage", () => {
  return HttpResponse.json({
    used: 10,
    limit: 10,
    planTier: "free",
  });
});

export const errorHandlers = {
  unauthorized: http.all("*", () => {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }),
  serverError: http.all("*", () => {
    return HttpResponse.json({ error: "Internal server error" }, { status: 500 });
  }),
};
