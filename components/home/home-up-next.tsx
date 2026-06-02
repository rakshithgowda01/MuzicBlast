"use client";

import { useQuery } from "@tanstack/react-query";
import { ListMusic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlayerStore } from "@/stores/player-store";
import type { SearchTrack } from "@/services/search-provider";

async function fetchRecommendations(title: string, artist: string, exclude: string[]) {
  const url = new URL("/api/recommendations", window.location.origin);
  url.searchParams.set("title", title);
  url.searchParams.set("artist", artist);
  url.searchParams.set("limit", "10");
  for (const id of exclude) url.searchParams.append("exclude", id);
  const response = await fetch(url.toString());
  const body = (await response.json()) as { tracks?: SearchTrack[] };
  return body.tracks ?? [];
}

export function HomeUpNext() {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const enqueueMany = usePlayerStore((s) => s.enqueueMany);

  const upNext = currentIndex >= 0 ? queue.slice(currentIndex + 1, currentIndex + 6) : [];
  const exclude = queue.map((t) => t.id);

  const recQuery = useQuery({
    queryKey: ["home-recs", activeTrack?.id],
    enabled: Boolean(activeTrack),
    queryFn: () => fetchRecommendations(activeTrack?.title ?? "", activeTrack?.artist ?? "", exclude)
  });

  return (
    <section className="space-y-4">
      <Card className="overflow-hidden rounded-[28px]">
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Up Next</p>
              <p className="text-xs text-muted-foreground">What plays next in your queue.</p>
            </div>
            <ListMusic className="size-5 text-primary" />
          </div>

          {upNext.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue is empty. Play something from Search.</p>
          ) : (
            <div className="space-y-2">
              {upNext.map((track) => (
                <button
                  key={track.id}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
                  type="button"
                  onClick={() => playQueue(queue, queue.findIndex((t) => t.id === track.id))}
                >
                  <p className="truncate text-sm font-medium">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[28px]">
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Recommended</p>
              <p className="text-xs text-muted-foreground">More like what you’re listening to.</p>
            </div>
            <Button
              variant="ghost"
              disabled={!activeTrack || (recQuery.data ?? []).length === 0}
              onClick={() => enqueueMany(recQuery.data ?? [], "append")}
            >
              Add all
            </Button>
          </div>

          {!activeTrack ? (
            <p className="text-sm text-muted-foreground">Start playback to get recommendations.</p>
          ) : (recQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations yet.</p>
          ) : (
            <div className="space-y-2">
              {(recQuery.data ?? []).slice(0, 6).map((track) => (
                <button
                  key={track.id}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
                  type="button"
                  onClick={() => playQueue([track], 0)}
                >
                  <p className="truncate text-sm font-medium">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

