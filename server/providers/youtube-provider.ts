import type { YouTubeProvider } from "@/services/youtube-provider";
import { normalizeYtDlpSearchEntry } from "@/server/yt-dlp/normalize";
import { YtDlpClient } from "@/server/yt-dlp/client";

class ProviderNotConfiguredError extends Error {
  constructor(method: string) {
    super(`YouTubeProvider.${method} is not configured in Phase 1.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export function createYouTubeProvider(): YouTubeProvider {
  const ytDlp = new YtDlpClient();

  return {
    async search(query, limit) {
      const entries = await ytDlp.search(query, limit ?? 12);
      return entries.flatMap((entry) => {
        const track = normalizeYtDlpSearchEntry(entry);
        return track ? [track] : [];
      });
    },
    async resolveStream(trackId) {
      const stream = await ytDlp.resolveStream(trackId);
      return {
        ...stream,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15)
      };
    },
    async getLyrics() {
      throw new ProviderNotConfiguredError("getLyrics");
    }
  };
}
