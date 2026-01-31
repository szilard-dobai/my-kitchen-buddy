import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guestOnlyPaths = ["/login", "/register"];

function createRateLimiters() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({ url, token });

  return {
    extract: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:extract",
    }),
    tracking: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "ratelimit:tracking",
    }),
    billing: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "ratelimit:billing",
    }),
  };
}

const rateLimiters = createRateLimiters();

function getIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}

function getRateLimiter(pathname: string) {
  if (!rateLimiters) return null;

  if (pathname === "/api/extract") {
    return rateLimiters.extract;
  }
  if (pathname === "/api/tracking") {
    return rateLimiters.tracking;
  }
  if (pathname.startsWith("/api/billing/")) {
    return rateLimiters.billing;
  }
  return null;
}

async function handleRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (request.method !== "POST") {
    return null;
  }

  const limiter = getRateLimiter(request.nextUrl.pathname);
  if (!limiter) {
    return null;
  }

  const identifier = getIdentifier(request);

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      );
    }
  } catch (error) {
    console.error("Rate limit error:", error);
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = await handleRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  const isGuestOnlyPath = guestOnlyPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isHomePage = pathname === "/";

  if (!sessionCookie && !isGuestOnlyPath && !isHomePage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isGuestOnlyPath) {
    return NextResponse.redirect(new URL("/recipes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.png|apple-icon.png|manifest-icon-.*\\.png|favicon-.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
};
