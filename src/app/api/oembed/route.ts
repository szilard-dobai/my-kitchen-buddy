import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOEmbed } from "@/services/oembed";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const result = await getOEmbed(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching oEmbed:", error);
    return NextResponse.json(
      { error: "Failed to fetch oEmbed" },
      { status: 500 },
    );
  }
}
