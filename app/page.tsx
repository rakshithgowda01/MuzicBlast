"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, Loader2, Play, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SearchTrack } from "@/services/search-provider";
import { usePlayerStore } from "@/stores/player-store";
import { useDownloadActions, useDownloads } from "@/hooks/use-downloads";
import { cn } from "@/lib/utils";

async function searchTracks(query: string) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
  const body = (await response.json()) as { tracks?: SearchTrack[] };
  return body.tracks ?? [];
}

export default function HomePage() {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const playTrack = usePlayerStore((state) => state.playTrack);
  const enqueue = usePlayerStore((state) => state.enqueue);

  const { data: downloads = [] } = useDownloads();
  const { startDownload } = useDownloadActions();

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["home-inline-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: () => searchTracks(debounced)
  });

  return (
    <div className="space-y-6 px-1 py-2 sm:px-2 sm:py-4 select-none">
      <div className="relative z-10 space-y-8">
        <section className="-ml-3.5 sm:-ml-5.5 lg:-ml-7.5">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Hey Rakshith,
              </h1>
              <p className="mt-1.5 text-base font-medium text-white/80 sm:text-xl">
                what you wanna listen today
              </p>
            </div>

            <div className="max-w-md space-y-2 relative z-20">
              <div className="relative flex items-center">
                <Search className="absolute left-4 size-4 text-white/50" />
                <input
                  className="h-11 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/[0.08] transition duration-200"
                  placeholder="Search songs and artists..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {debounced.length >= 2 ? (
                <div className="absolute top-13 left-0 right-0 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/60 p-2 backdrop-blur-xl shadow-2xl z-30">
                  {searchQuery.isFetching ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-white/70">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Searching...
                    </div>
                  ) : (searchQuery.data ?? []).length === 0 ? (
                    <p className="p-3 text-sm text-white/60">No results found.</p>
                  ) : (
                    <div className="space-y-1">
                      {(searchQuery.data ?? []).map((track) => {
                        const isDownloaded = downloads.some((d) => d.trackId === track.id && d.status === "completed");
                        const isDownloading = downloads.some((d) => d.trackId === track.id && d.status === "downloading");

                        return (
                          <div
                            key={track.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 hover:bg-white/[0.08] transition duration-150"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">{track.title}</p>
                              <p className="truncate text-xs text-white/60">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-full text-white hover:bg-white/15"
                                onClick={() => playTrack(track)}
                              >
                                <Play className="size-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={isDownloaded || isDownloading}
                                className={cn(
                                  "size-8 rounded-full text-white hover:bg-white/15",
                                  isDownloaded && "text-green-400 hover:text-green-400"
                                )}
                                onClick={() => void startDownload(track)}
                                title={isDownloaded ? "Downloaded" : isDownloading ? "Downloading..." : "Download"}
                              >
                                {isDownloading ? (
                                  <Loader2 className="size-4 animate-spin text-primary" />
                                ) : isDownloaded ? (
                                  <Check className="size-4" />
                                ) : (
                                  <Download className="size-4" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-full text-xs text-white hover:bg-white/15 px-3"
                                onClick={() => enqueue(track, "append")}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
