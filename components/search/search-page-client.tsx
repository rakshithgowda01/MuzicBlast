"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ListPlus, Loader2, Play, Search, WifiOff } from "lucide-react";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/components/player/format-time";
import { useFavoriteActions, useFavorites } from "@/hooks/use-favorites";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { SearchTrack } from "@/services/search-provider";
import { usePlayerStore } from "@/stores/player-store";

interface SearchResponse {
  tracks: SearchTrack[];
  error?: {
    code: string;
    message: string;
  };
}

async function searchTracks(query: string) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`);
  const body = (await response.json()) as SearchResponse;

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Search failed.");
  }

  return body.tracks;
}

export function SearchPageClient() {
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 450);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const favoritesQuery = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteActions();
  const favoriteIds = new Set((favoritesQuery.data ?? []).map((item) => item.videoId));

  const searchQuery = useQuery({
    queryKey: ["youtube-search", debouncedQuery],
    queryFn: () => searchTracks(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2
  });

  const tracks = searchQuery.data ?? [];

  return (
    <section className="space-y-5">
      <Card>
        <CardContent className="pt-5">
          <label className="flex h-14 items-center gap-3 rounded-lg border border-white/10 bg-black/35 px-4 focus-within:border-primary/70">
            <Search className="size-5 text-muted-foreground" />
            <input
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              placeholder="Search songs, artists, live sets, remixes"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {searchQuery.isFetching ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : null}
          </label>
        </CardContent>
      </Card>

      {debouncedQuery.trim().length < 2 ? (
        <EmptySearchState />
      ) : searchQuery.isError ? (
        <SearchError message={(searchQuery.error as Error).message} />
      ) : tracks.length === 0 && !searchQuery.isFetching ? (
        <Card>
          <CardContent className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">
            No YouTube results found for &ldquo;{debouncedQuery}&rdquo;.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <article
              key={track.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.07]"
            >
              <div className="relative flex size-14 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                {track.thumbnailUrl ? (
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={track.thumbnailUrl}
                    unoptimized
                  />
                ) : (
                  <Search className="size-5 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium sm:text-base">{track.title}</h2>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {track.artist} / {formatTime(track.durationSeconds)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  aria-label={`Play ${track.title}`}
                  size="icon"
                  variant="premium"
                  onClick={() => playTrack(track)}
                >
                  <Play />
                </Button>
                <Button
                  aria-label={`Add ${track.title} to queue`}
                  size="icon"
                  variant="ghost"
                  onClick={() => enqueue(track, "append")}
                >
                  <ListPlus />
                </Button>
                <FavoriteButton
                  active={favoriteIds.has(track.id)}
                  label={`${favoriteIds.has(track.id) ? "Remove" : "Add"} ${track.title} ${
                    favoriteIds.has(track.id) ? "from" : "to"
                  } favorites`}
                  onClick={() => {
                    if (favoriteIds.has(track.id)) {
                      void removeFavorite(track.id);
                      return;
                    }

                    void addFavorite({
                      videoId: track.id,
                      title: track.title,
                      artist: track.artist,
                      thumbnail: track.thumbnailUrl
                    });
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptySearchState() {
  return (
    <Card>
      <CardContent className="flex min-h-44 items-center justify-center text-center text-sm leading-6 text-muted-foreground">
        Type at least two characters to search YouTube through the backend provider.
      </CardContent>
    </Card>
  );
}

function SearchError({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
        <WifiOff className="size-6 text-destructive" />
        <div>
          <p className="font-medium">Search is unavailable</p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
