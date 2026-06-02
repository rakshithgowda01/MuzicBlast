import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createYouTubeProvider } from "@/server/providers/youtube-provider";
import { YtDlpError } from "@/server/yt-dlp/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get("trackId")?.trim() ?? "";
  if (!trackId) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "trackId query parameter is required."
        }
      },
      { status: 400 }
    );
  }

  try {
    const download = await prisma.download.findFirst({
      where: { trackId, status: "completed" }
    });
    if (download?.filePath) {
      return NextResponse.json({
        trackId,
        streamUrl: `/api/downloads/file?trackId=${encodeURIComponent(trackId)}`,
        mimeType: download.mimeType,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()
      });
    }

    const provider = createYouTubeProvider();
    const stream = await provider.resolveStream(trackId);
    return NextResponse.json({
      trackId: stream.trackId,
      streamUrl: stream.streamUrl,
      mimeType: stream.mimeType,
      expiresAt: stream.expiresAt.toISOString()
    });
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
          message: "Stream resolution failed."
        }
      },
      { status: 500 }
    );
  }
}
