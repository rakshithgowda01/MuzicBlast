import { createYouTubeProvider } from "@/server/providers/youtube-provider";
import { SearchService } from "@/server/search/search-service";

export function createSearchService() {
  return new SearchService(createYouTubeProvider());
}
