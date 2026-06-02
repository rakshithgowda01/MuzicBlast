import * as fs from "node:fs";

import { NextRequest, NextResponse } from "next/server";

import { DownloadsService } from "@/server/downloads/downloads-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadsService = new DownloadsService();

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get("trackId")?.trim() ?? "";
  if (!trackId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "trackId query parameter is required." } },
      { status: 400 }
    );
  }

  const resolved = await downloadsService.openFileStream(trackId);
  if (!resolved) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Download not found." } },
      { status: 404 }
    );
  }

  const stream = fs.createReadStream(resolved.filePath);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": resolved.completed.mimeType,
      "Content-Length": String(resolved.completed.sizeBytes),
      "Cache-Control": "no-store"
    }
  });
}

