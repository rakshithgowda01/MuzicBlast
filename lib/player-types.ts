export type RepeatMode = "none" | "one" | "all";
export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl: string;
  sourceUrl: string;
  streamUrl?: string;
}

export interface PlaybackSnapshot {
  currentTime: number;
  duration: number;
  bufferedUntil: number;
}
