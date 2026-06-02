import { prisma } from "@/lib/prisma";

export interface HistoryTrackInput {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
}

export class HistoryService {
  async list() {
    return prisma.playHistory.findMany({
      orderBy: { playedAt: "desc" },
      take: 50,
      include: {
        track: true
      }
    });
  }

  async record(input: HistoryTrackInput) {
    const trackId = input.id.trim();
    if (!trackId || !input.title || !input.artist) {
      throw new Error("Track ID, title, and artist are required.");
    }

    // 1. Ensure the track metadata exists in the Track table
    const durationSeconds = typeof input.durationSeconds === "number" ? input.durationSeconds : 0;
    await prisma.track.upsert({
      where: { id: trackId },
      update: {
        title: input.title.trim(),
        artist: input.artist.trim(),
        durationSeconds: durationSeconds,
        thumbnailUrl: (input.thumbnailUrl ?? "").trim()
      },
      create: {
        id: trackId,
        title: input.title.trim(),
        artist: input.artist.trim(),
        durationSeconds: durationSeconds,
        thumbnailUrl: (input.thumbnailUrl ?? "").trim(),
        sourceUrl: "" // Will be populated by stream if downloaded
      }
    });

    // 2. Add to PlayHistory
    return prisma.playHistory.create({
      data: {
        trackId
      },
      include: {
        track: true
      }
    });
  }
}
