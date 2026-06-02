"use client";

import {
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/components/player/format-time";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";

export function PlayerControls({
  onOpenQueue,
  onOpenLyrics
}: {
  onOpenQueue: () => void;
  onOpenLyrics: () => void;
}) {
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const bufferedUntil = usePlayerStore((state) => state.bufferedUntil);
  const canGoPrevious = usePlayerStore((state) => state.canGoPrevious);
  const canGoNext = usePlayerStore((state) => state.canGoNext);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const togglePlayback = usePlayerStore((state) => state.togglePlayback);
  const previous = usePlayerStore((state) => state.previous);
  const next = usePlayerStore((state) => state.next);
  const seek = usePlayerStore((state) => state.seek);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeatMode = usePlayerStore((state) => state.cycleRepeatMode);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const toggleMute = usePlayerStore((state) => state.toggleMute);

  const safeDuration = duration || 0;
  const seekPercent = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;
  const bufferedPercent = safeDuration > 0 ? (bufferedUntil / safeDuration) * 100 : 0;
  const isPlaying = status === "playing" || status === "loading";
  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;

  return (
    <div className="w-full space-y-3">
      <div className="relative h-5">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/20"
            style={{ width: `${Math.min(bufferedPercent, 100)}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary"
            style={{ width: `${Math.min(seekPercent, 100)}%` }}
          />
        </div>
        <input
          aria-label="Seek"
          className="absolute inset-0 h-5 w-full cursor-pointer opacity-0"
          disabled={safeDuration === 0}
          max={safeDuration || 1}
          min={0}
          step={0.1}
          type="range"
          value={Math.min(currentTime, safeDuration || currentTime)}
          onChange={(event) => seek(Number(event.target.value))}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            aria-label="Shuffle"
            size="icon"
            variant="ghost"
            className={cn(shuffle && "text-primary")}
            onClick={toggleShuffle}
          >
            <Shuffle />
          </Button>
          <Button
            aria-label="Previous"
            disabled={!canGoPrevious && currentTime <= 3}
            size="icon"
            variant="ghost"
            onClick={previous}
          >
            <SkipBack />
          </Button>
        </div>

        <Button
          aria-label={isPlaying ? "Pause" : "Play"}
          size="icon"
          variant="premium"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <div className="flex items-center justify-end gap-1">
          <Button aria-label="Next" disabled={!canGoNext} size="icon" variant="ghost" onClick={next}>
            <SkipForward />
          </Button>
          <Button
            aria-label="Repeat"
            size="icon"
            variant="ghost"
            className={cn(repeatMode !== "none" && "text-primary")}
            onClick={cycleRepeatMode}
          >
            <RepeatIcon />
          </Button>
          <Button aria-label="Queue" size="icon" variant="ghost" onClick={onOpenQueue}>
            <ListMusic />
          </Button>
          <Button aria-label="Lyrics" size="icon" variant="ghost" onClick={onOpenLyrics}>
            <Mic2 />
          </Button>
        </div>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <Button aria-label={muted ? "Unmute" : "Mute"} size="icon" variant="ghost" onClick={toggleMute}>
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
        <input
          aria-label="Volume"
          className="h-1.5 w-full cursor-pointer accent-primary"
          max={1}
          min={0}
          step={0.01}
          type="range"
          value={muted ? 0 : volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
