import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { hasPasswordAccount, updateUserEmail } from "@/models/user";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPassword = await hasPasswordAccount(session.user.id);

    return NextResponse.json({ hasPassword });
  } catch (error) {
    console.error("Error checking account:", error);
    return NextResponse.json(
      { error: "Failed to check account" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, currentPassword } = body;

    if (!email || !currentPassword) {
      return NextResponse.json(
        { error: "Email and current password are required" },
        { status: 400 },
      );
    }

    const hasPassword = await hasPasswordAccount(session.user.id);
    if (!hasPassword) {
      return NextResponse.json(
        { error: "Cannot change email for OAuth-only accounts" },
        { status: 400 },
      );
    }

    const signInResult = await auth.api.signInEmail({
      body: {
        email: session.user.email,
        password: currentPassword,
      },
    });

    if (!signInResult) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    const updated = await updateUserEmail(session.user.id, email);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
