import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { deleteUserAndAllData } from "@/models/user";

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUserAndAllData(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
