import { NextRequest, NextResponse } from "next/server";

import { DownloadsService } from "@/server/downloads/downloads-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadsService = new DownloadsService();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await params;
    const result = await downloadsService.remove(trackId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove download.";
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message } },
      { status: 400 }
    );
  }
}

