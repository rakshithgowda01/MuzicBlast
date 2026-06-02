export interface SearchTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl: string;
  sourceUrl: string;
}

export interface SearchProvider {
  search(query: string, limit?: number): Promise<SearchTrack[]>;
}
