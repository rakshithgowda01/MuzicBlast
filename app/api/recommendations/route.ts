import { NextRequest, NextResponse } from "next/server";

import { RecommendationsService } from "@/server/recommendations/recommendations-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recommendationsService = new RecommendationsService();

function parseLimit(value: string | null) {
  if (!value) return 12;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 12;
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim() ?? "";
  const artist = request.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const exclude = request.nextUrl.searchParams.getAll("exclude");
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const tracks = await recommendationsService.recommendFromSeed(
      { title, artist },
      { limit, excludeIds: exclude }
    );
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "FAILED",
          message: "Unable to fetch recommendations."
        }
      },
      { status: 500 }
    );
  }
}

