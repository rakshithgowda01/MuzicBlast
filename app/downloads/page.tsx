"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDownloads, useDownloadActions } from "@/hooks/use-downloads";
import { usePlayerStore } from "@/stores/player-store";
import { History, Play, Trash2 } from "lucide-react";
import Image from "next/image";

export default function DownloadsPage() {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const downloadsQuery = useDownloads();
  const { removeDownload } = useDownloadActions();
  const downloads = downloadsQuery.data ?? [];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        eyebrow="Offline"
        title="Downloads"
        description="Downloaded audio managed for offline playback."
      />
      {downloads.length === 0 ? (
        <Card className="rounded-[28px] border-white/5 bg-white/[0.02]">
          <CardContent className="flex min-h-48 items-center justify-center p-5 text-muted-foreground text-sm">
            Download songs from Search or the Player to build an offline library.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {downloads.map((download) => {
            const track = download.track;
            const title = track?.title ?? download.trackId;
            const artist = track?.artist ?? "Offline";
            const thumbnail = track?.thumbnailUrl;

            return (
              <div
                key={download.trackId}
                className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06] select-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-xl bg-muted shadow-md">
                    {thumbnail ? (
                      <Image
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        src={thumbnail}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/40">
                        <History className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    {download.status === "completed" && (
                      <button
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                        onClick={() =>
                          playTrack({
                            id: download.trackId,
                            title: title,
                            artist: artist,
                            durationSeconds: track?.durationSeconds ?? 0,
                            thumbnailUrl: thumbnail ?? "",
                            sourceUrl: track?.sourceUrl ?? `https://www.youtube.com/watch?v=${download.trackId}`
                          })
                        }
                      >
                        <Play className="size-5 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {artist} • <span className="capitalize">{download.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-2">
                  {download.status === "completed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-full text-xs text-white hover:bg-white/15 px-3"
                      onClick={() =>
                        playTrack({
                          id: download.trackId,
                          title: title,
                          artist: artist,
                          durationSeconds: track?.durationSeconds ?? 0,
                          thumbnailUrl: thumbnail ?? "",
                          sourceUrl: track?.sourceUrl ?? `https://www.youtube.com/watch?v=${download.trackId}`
                        })
                      }
                    >
                      Play
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                    onClick={() => void removeDownload(download.trackId)}
                    title="Delete Download"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
