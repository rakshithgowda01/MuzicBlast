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

function parseType(value: string | null): "smart" | "nightDrive" | "coding" {
  if (value === "nightDrive" || value === "coding") return value;
  return "smart";
}

export async function GET(request: NextRequest) {
  const type = parseType(request.nextUrl.searchParams.get("type"));
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const tracks = await recommendationsService.mix(type, limit);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "FAILED",
          message: "Unable to fetch mix."
        }
      },
      { status: 500 }
    );
  }
}

