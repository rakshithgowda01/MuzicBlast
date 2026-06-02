import { createYouTubeProvider } from "@/server/providers/youtube-provider";

function normalizeSeed(seed: { title?: string; artist?: string }) {
  return {
    title: (seed.title ?? "").trim(),
    artist: (seed.artist ?? "").trim()
  };
}

function buildQueries(seed: { title: string; artist: string }) {
  const queries: string[] = [];

  if (seed.artist && seed.title) {
    queries.push(`${seed.artist} ${seed.title}`);
    queries.push(`${seed.artist} mix`);
    queries.push(`${seed.artist} radio`);
    queries.push(`${seed.title} remix`);
  } else if (seed.title) {
    queries.push(seed.title);
    queries.push(`${seed.title} mix`);
  } else if (seed.artist) {
    queries.push(`${seed.artist} mix`);
    queries.push(`${seed.artist} radio`);
  }

  return Array.from(new Set(queries));
}

export class RecommendationsService {
  private readonly provider = createYouTubeProvider();

  async recommendFromSeed(
    seed: { title?: string; artist?: string },
    options: { limit: number; excludeIds: string[] }
  ) {
    const normalizedSeed = normalizeSeed(seed);
    const queries = buildQueries(normalizedSeed);
    const limit = Math.min(Math.max(Math.floor(options.limit), 1), 25);
    const seen = new Set(options.excludeIds.map((id) => id.trim()).filter(Boolean));

    if (queries.length === 0) {
      return [];
    }

    const results: Awaited<ReturnType<typeof this.provider.search>> = [];
    for (const query of queries) {
      const tracks = await this.provider.search(query, 12);
      for (const track of tracks) {
        if (seen.has(track.id)) {
          continue;
        }
        seen.add(track.id);
        results.push(track);
        if (results.length >= limit) {
          break;
        }
      }
      if (results.length >= limit) {
        break;
      }
    }

    return results;
  }

  async mix(type: "smart" | "nightDrive" | "coding", limit: number) {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 25);
    const query =
      type === "nightDrive"
        ? "night drive synthwave mix"
        : type === "coding"
          ? "lofi coding mix"
          : "music mix";

    return this.provider.search(query, safeLimit);
  }
}

