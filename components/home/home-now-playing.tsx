"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import type { SearchTrack } from "@/services/search-provider";

async function fetchMix() {
  const response = await fetch("/api/mixes?type=smart&limit=8");
  const body = (await response.json()) as { tracks?: SearchTrack[] };
  return body.tracks ?? [];
}

export function HomeNowPlaying() {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const status = usePlayerStore((s) => s.status);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const isPlaying = status === "playing" || status === "loading";
  const mixQuery = useQuery({ queryKey: ["home-mix"], queryFn: fetchMix });

  return (
    <section className="glass-panel overflow-hidden rounded-[32px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Now Playing</p>
          <p className="text-lg font-semibold">{activeTrack?.title ?? "Nothing playing"}</p>
          <p className="text-sm text-muted-foreground">{activeTrack?.artist ?? "Queue a track to start."}</p>
        </div>
        <Button aria-label={isPlaying ? "Pause" : "Play"} size="icon" variant="premium" onClick={togglePlayback}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05]">
        {activeTrack?.thumbnailUrl ? (
          <Image
            alt=""
            src={activeTrack.thumbnailUrl}
            fill
            className="object-cover"
            sizes="420px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Sparkles className="size-6" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
          <p className="text-sm font-medium">Smart Mix</p>
          <p className="text-xs text-muted-foreground">Tap to start a mix based on discovery.</p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {(mixQuery.data ?? []).slice(0, 5).map((track) => (
              <button
                key={track.id}
                className={cn("min-w-[160px] rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-left transition hover:bg-white/[0.07]")}
                type="button"
                onClick={() => playQueue([track], 0)}
              >
                <p className="truncate text-xs font-medium">{track.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{track.artist}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

