import type { SearchProvider, SearchTrack } from "@/services/search-provider";

const DEFAULT_SEARCH_LIMIT = 12;
const MAX_SEARCH_LIMIT = 25;

export class SearchService {
  constructor(private readonly provider: SearchProvider) {}

  async search(query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<SearchTrack[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_SEARCH_LIMIT);
    return this.provider.search(normalizedQuery, safeLimit);
  }
}
