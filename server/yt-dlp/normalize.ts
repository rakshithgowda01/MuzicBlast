import type { SearchTrack } from "@/services/search-provider";
import type { YtDlpSearchEntry } from "@/server/yt-dlp/client";

interface Thumbnail {
  url?: unknown;
  width?: unknown;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asDurationSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.round(value);
}

function getBestThumbnail(entry: YtDlpSearchEntry) {
  if (Array.isArray(entry.thumbnails)) {
    const thumbnails = entry.thumbnails as Thumbnail[];
    const sorted = thumbnails
      .filter((thumbnail) => asString(thumbnail.url))
      .sort((a, b) => {
        const widthA = typeof a.width === "number" ? a.width : 0;
        const widthB = typeof b.width === "number" ? b.width : 0;
        return widthB - widthA;
      });

    return asString(sorted[0]?.url);
  }

  return asString(entry.thumbnail);
}

export function normalizeYtDlpSearchEntry(entry: YtDlpSearchEntry): SearchTrack | null {
  const id = asString(entry.id);
  const title = asString(entry.title);
  const artist = asString(entry.channel) || asString(entry.uploader) || "Unknown Artist";
  const sourceUrl =
    asString(entry.webpage_url) || (id ? `https://www.youtube.com/watch?v=${id}` : asString(entry.url));

  if (!id || !title || !sourceUrl) {
    return null;
  }

  return {
    id,
    title,
    artist,
    durationSeconds: asDurationSeconds(entry.duration),
    thumbnailUrl: getBestThumbnail(entry),
    sourceUrl
  };
}
