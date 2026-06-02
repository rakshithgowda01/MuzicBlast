import { NextRequest, NextResponse } from "next/server";

import { FavoritesService } from "@/server/favorites/favorites-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const favoritesService = new FavoritesService();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const result = await favoritesService.remove(videoId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove favorite.";
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message
        }
      },
      { status: 400 }
    );
  }
}
