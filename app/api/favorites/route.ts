import { NextRequest, NextResponse } from "next/server";

import { FavoritesService } from "@/server/favorites/favorites-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const favoritesService = new FavoritesService();

export async function GET() {
  try {
    const favorites = await favoritesService.list();
    return NextResponse.json({ favorites });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "FAILED",
          message: "Unable to load favorites."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      videoId?: string;
      title?: string;
      artist?: string;
      thumbnail?: string;
    };

    const favorite = await favoritesService.add({
      videoId: body.videoId ?? "",
      title: body.title ?? "",
      artist: body.artist ?? "",
      thumbnail: body.thumbnail ?? ""
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add favorite.";
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
