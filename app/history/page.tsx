"use client";

import { Calendar, History, Play } from "lucide-react";
import Image from "next/image";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/hooks/use-history";
import { usePlayerStore } from "@/stores/player-store";
import { formatTime } from "@/components/player/format-time";

export default function HistoryPage() {
  const { data: history = [], isLoading, error } = useHistory();
  const playTrack = usePlayerStore((state) => state.playTrack);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        eyebrow="Timeline"
        title="Recently played"
        description="Listening history captured automatically by the player."
      />

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Loading your history...
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-950/10">
          <CardContent className="flex min-h-48 items-center justify-center p-5 text-sm text-red-400">
            Failed to load play history. Please try again later.
          </CardContent>
        </Card>
      ) : history.length === 0 ? (
        <Card className="rounded-[28px] border-white/5 bg-white/[0.02]">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 pt-5 text-muted-foreground">
            <History className="size-8 text-muted-foreground/55" />
            <p className="text-sm">No songs played yet. Start searching and playing tracks!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const playedAtDate = new Date(entry.playedAt);
            const formattedTime = playedAtDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit"
            });
            const formattedDate = playedAtDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric"
            });

            return (
              <div
                key={entry.id}
                className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] select-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-xl bg-muted shadow-md">
                    {entry.track.thumbnailUrl ? (
                      <Image
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        src={entry.track.thumbnailUrl}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/40">
                        <History className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                      onClick={() =>
                        playTrack({
                          id: entry.track.id,
                          title: entry.track.title,
                          artist: entry.track.artist,
                          durationSeconds: entry.track.durationSeconds,
                          thumbnailUrl: entry.track.thumbnailUrl,
                          sourceUrl: entry.track.sourceUrl || ""
                        })
                      }
                    >
                      <Play className="size-5 text-white" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      {entry.track.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.track.artist} • {formatTime(entry.track.durationSeconds)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right text-[11px] text-muted-foreground pr-2">
                  <span className="flex items-center gap-1 font-medium text-white/70">
                    <Calendar className="size-3" />
                    {formattedDate}
                  </span>
                  <span>at {formattedTime}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

