import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DownloadsService } from "@/server/downloads/downloads-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadsService = new DownloadsService();

export async function GET() {
  try {
    const downloads = await downloadsService.list();
    return NextResponse.json({ downloads });
  } catch {
    return NextResponse.json(
      { error: { code: "FAILED", message: "Unable to load downloads." } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      trackId?: string;
      title?: string;
      artist?: string;
      durationSeconds?: number;
      thumbnailUrl?: string;
    };

    const trackId = body.trackId?.trim() ?? "";
    if (!trackId) {
      throw new Error("trackId is required.");
    }

    // 1. Ensure Track metadata exists in the database to satisfy the foreign key constraint
    if (body.title && body.artist) {
      await prisma.track.upsert({
        where: { id: trackId },
        update: {
          title: body.title.trim(),
          artist: body.artist.trim(),
          durationSeconds: body.durationSeconds ?? 0,
          thumbnailUrl: (body.thumbnailUrl ?? "").trim()
        },
        create: {
          id: trackId,
          title: body.title.trim(),
          artist: body.artist.trim(),
          durationSeconds: body.durationSeconds ?? 0,
          thumbnailUrl: (body.thumbnailUrl ?? "").trim(),
          sourceUrl: ""
        }
      });
    } else {
      // Fallback: create placeholder Track if it does not exist
      const existingTrack = await prisma.track.findUnique({ where: { id: trackId } });
      if (!existingTrack) {
        await prisma.track.create({
          data: {
            id: trackId,
            title: "Unknown Track",
            artist: "Unknown Artist",
            durationSeconds: 0,
            thumbnailUrl: "",
            sourceUrl: ""
          }
        });
      }
    }

    // 2. Start the download
    const download = await downloadsService.startDownload(trackId);
    return NextResponse.json({ download }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start download.";
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message } },
      { status: 400 }
    );
  }
}

