import { NextRequest, NextResponse } from "next/server";

import { LyricsService } from "@/server/lyrics/lyrics-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lyricsService = new LyricsService();

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim() ?? "";
  const artist = request.nextUrl.searchParams.get("artist")?.trim() ?? "";

  if (!title) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "title query parameter is required." } },
      { status: 400 }
    );
  }

  try {
    const lines = await lyricsService.getLyrics({ title, artist });
    return NextResponse.json({ lines });
  } catch {
    return NextResponse.json(
      { error: { code: "FAILED", message: "Unable to load lyrics." } },
      { status: 500 }
    );
  }
}

