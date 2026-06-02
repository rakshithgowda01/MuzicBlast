import { NextRequest, NextResponse } from "next/server";

import { HistoryService } from "@/server/history/history-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const historyService = new HistoryService();

export async function GET() {
  try {
    const history = await historyService.list();
    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load play history.";
    return NextResponse.json(
      {
        error: {
          code: "FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id?: string;
      title?: string;
      artist?: string;
      durationSeconds?: number;
      thumbnailUrl?: string;
    };

    if (!body.id || !body.title || !body.artist) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_REQUEST",
            message: "Track ID, title, and artist are required."
          }
        },
        { status: 400 }
      );
    }

    const historyEntry = await historyService.record({
      id: body.id,
      title: body.title,
      artist: body.artist,
      durationSeconds: body.durationSeconds ?? 0,
      thumbnailUrl: body.thumbnailUrl ?? ""
    });

    return NextResponse.json({ history: historyEntry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record history.";
    return NextResponse.json(
      {
        error: {
          code: "FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
