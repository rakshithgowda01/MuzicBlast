import { NextRequest, NextResponse } from "next/server";

import { createSearchService } from "@/server/search";
import { YtDlpError } from "@/server/yt-dlp/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  if (!query) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const searchService = createSearchService();
    const tracks = await searchService.search(query, limit);
    return NextResponse.json({ tracks });
  } catch (error) {
    if (error instanceof YtDlpError) {
      const status = error.code === "NOT_FOUND" ? 503 : 502;
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message
          }
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "UNKNOWN",
          message: "Search failed."
        }
      },
      { status: 500 }
    );
  }
}
