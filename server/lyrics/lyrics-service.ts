import type { LyricsLine } from "@/services/lyrics-provider";

export class LyricsService {
  async getLyrics(track: { title: string; artist: string }): Promise<LyricsLine[]> {
    const title = track.title.trim();
    const artist = track.artist.trim();
    if (!title) {
      return [];
    }

    // Phase 5 baseline: pluggable provider scaffold.
    // We return a friendly unsynced placeholder so the UI is functional.
    return [
      { text: `${title}${artist ? ` — ${artist}` : ""}` },
      { text: "Lyrics provider is not configured yet." }
    ];
  }
}

