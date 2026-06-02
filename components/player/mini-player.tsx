"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Music2, Pause, Play, SkipForward, Trash2, Download, Check, Loader2 } from "lucide-react";

import { FavoriteButton } from "@/components/favorites/favorite-button";
import { useFavoriteActions, useFavorites } from "@/hooks/use-favorites";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import { PlayerControls } from "./player-controls";
import { LyricsDrawer } from "./lyrics-drawer";
import { useDownloadActions, useDownloads } from "@/hooks/use-downloads";

export function MiniPlayer() {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const togglePlayback = usePlayerStore((state) => state.togglePlayback);
  const next = usePlayerStore((state) => state.next);
  const canGoNext = usePlayerStore((state) => state.canGoNext);

  // Queue actions and state from player store
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = React.useState(false);
  const [showQueue, setShowQueue] = React.useState(false);

  const favoritesQuery = useFavorites();
  const { addFavorite, removeFavorite } = useFavoriteActions();
  const favoriteIds = new Set((favoritesQuery.data ?? []).map((item) => item.videoId));
  const isActiveFavorite = activeTrack ? favoriteIds.has(activeTrack.id) : false;
  const isPlaying = status === "playing" || status === "loading";

  // Downloads queries
  const downloadsQuery = useDownloads();
  const { startDownload } = useDownloadActions();
  const downloads = downloadsQuery.data ?? [];
  const isDownloaded = activeTrack ? downloads.some((d) => d.trackId === activeTrack.id && d.status === "completed") : false;
  const isDownloading = activeTrack ? downloads.some((d) => d.trackId === activeTrack.id && d.status === "downloading") : false;

  // Reset showQueue when player is minimized
  React.useEffect(() => {
    if (!isExpanded) {
      setShowQueue(false);
    }
  }, [isExpanded]);

  if (!activeTrack) {
    return null;
  }

  const progress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;
  const circumference = 2 * Math.PI * 21; // radius 21

  return (
    <>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Minimized Compact Bottom-Right Floating Card
          <motion.div
            key="minimized-player"
            className="glass-panel fixed bottom-24 right-4 z-[80] flex w-72 items-center gap-3 rounded-full py-2 pl-2 pr-3 shadow-lg cursor-pointer hover:bg-white/[0.08] transition duration-200 select-none"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
          >
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/50 shadow-md",
                  isPlaying && "animate-[spin_8s_linear_infinite]"
                )}
              >
                {activeTrack.thumbnailUrl ? (
                  <Image
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    src={activeTrack.thumbnailUrl}
                    unoptimized
                  />
                ) : (
                  <Music2 className="size-4 text-muted-foreground" />
                )}
                <div className="absolute size-2 rounded-full border border-white/30 bg-black/85" />
              </div>
              <svg className="pointer-events-none absolute -inset-1 size-12" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  fill="none"
                  stroke="#ff3b5f"
                  strokeWidth="2"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - progress)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{activeTrack.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{activeTrack.artist}</p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                className="rounded-full bg-primary/95 p-1.5 text-white transition hover:bg-primary cursor-pointer"
                type="button"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
              </button>
              <button
                className="rounded-full bg-white/10 p-1.5 text-muted-foreground transition hover:bg-white/20 hover:text-white disabled:opacity-40 cursor-pointer"
                disabled={!canGoNext}
                type="button"
                onClick={next}
              >
                <SkipForward className="size-3" />
              </button>
            </div>
          </motion.div>
        ) : (
          // Expanded Glassmorphic Player Card / Window
          <>
            <motion.div
              key="player-overlay"
              className="fixed inset-0 z-[79] bg-transparent cursor-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />
            <motion.div
              key="expanded-player"
              className="glass-panel fixed bottom-24 right-4 sm:right-6 z-[80] flex w-[min(92vw,360px)] flex-col items-center gap-4 rounded-[30px] p-5 shadow-2xl select-none animate-fade-in"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
            <div className="flex w-full items-center justify-between">
              <button
                className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-white transition cursor-pointer"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="size-5" />
              </button>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                {showQueue ? "Up Next Queue" : "Now Playing"}
              </span>
              <div className="size-7" /> {/* Spacer to align text center */}
            </div>

            {/* Content Area: Animate between Album Artwork and Scrollable Queue */}
            <div className="w-full max-w-[240px] mt-2">
              <AnimatePresence mode="wait">
                {showQueue ? (
                  <motion.div
                    key="inline-queue"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex h-[240px] w-full flex-col px-1"
                  >
                    <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                        {queue.length} Tracks
                      </span>
                      {queue.length > 0 && (
                        <button
                          className="text-[9px] font-semibold text-red-400 hover:text-red-300 transition cursor-pointer"
                          type="button"
                          onClick={clearQueue}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {queue.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground text-center">
                          Queue is empty.
                        </div>
                      ) : (
                        queue.map((track, idx) => (
                          <div
                            key={`${track.id}-${idx}`}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition text-[10px]",
                              idx === currentIndex
                                ? "bg-white/15 border border-white/10 text-primary"
                                : "hover:bg-white/[0.04] text-white/80 border border-transparent"
                            )}
                          >
                            <button
                              className="min-w-0 text-left flex-1 cursor-pointer"
                              type="button"
                              onClick={() => playQueue(queue, idx)}
                            >
                              <p className="truncate font-medium leading-none mb-0.5">{track.title}</p>
                              <p className="truncate text-[8px] text-muted-foreground leading-none">
                                {track.artist}
                              </p>
                            </button>
                            <button
                              className="text-muted-foreground hover:text-red-500 transition p-0.5 cursor-pointer flex-shrink-0"
                              type="button"
                              onClick={() => removeFromQueue(idx)}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="artwork-display"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl"
                  >
                    {activeTrack.thumbnailUrl ? (
                      <Image
                        alt=""
                        fill
                        className="object-cover"
                        sizes="240px"
                        src={activeTrack.thumbnailUrl}
                        unoptimized
                      />
                    ) : (
                      <Music2 className="size-16 text-muted-foreground/40" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Title / Artist / Favorite Song / Download option */}
            <div className="flex w-full items-center justify-between gap-3 px-1 mt-2">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-white">{activeTrack.title}</h2>
                <p className="truncate text-xs text-muted-foreground">{activeTrack.artist}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  disabled={isDownloaded || isDownloading}
                  className={cn(
                    "rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer flex items-center justify-center",
                    isDownloaded && "text-green-400 hover:text-green-400"
                  )}
                  onClick={() => {
                    void startDownload({
                      id: activeTrack.id,
                      title: activeTrack.title,
                      artist: activeTrack.artist,
                      durationSeconds: activeTrack.durationSeconds,
                      thumbnailUrl: activeTrack.thumbnailUrl
                    });
                  }}
                  title={isDownloaded ? "Downloaded" : isDownloading ? "Downloading..." : "Download"}
                  type="button"
                >
                  {isDownloading ? (
                    <Loader2 className="size-4 animate-spin text-primary" strokeWidth={3} />
                  ) : isDownloaded ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <Download className="size-4" />
                  )}
                </button>

                <FavoriteButton
                  active={isActiveFavorite}
                  label={`${isActiveFavorite ? "Remove" : "Add"} ${activeTrack.title} ${
                    isActiveFavorite ? "from" : "to"
                  } favorites`}
                  onClick={() => {
                    if (isActiveFavorite) {
                      void removeFavorite(activeTrack.id);
                      return;
                    }
                    void addFavorite({
                      videoId: activeTrack.id,
                      title: activeTrack.title,
                      artist: activeTrack.artist,
                      thumbnail: activeTrack.thumbnailUrl ?? ""
                    });
                  }}
                />
              </div>
            </div>

            {/* Player Controls (timeline, repeat, play/pause, queue, lyrics, etc) */}
            <div className="w-full">
              <PlayerControls
                onOpenLyrics={() => setIsLyricsOpen(true)}
                onOpenQueue={() => setShowQueue((v) => !v)}
              />
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      <LyricsDrawer open={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </>
  );
}
