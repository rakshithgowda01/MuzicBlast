"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { PlaybackStatus, PlayerTrack, RepeatMode } from "@/lib/player-types";

type QueueInsertMode = "play-now" | "play-next" | "append";

interface PlayerState {
  queue: PlayerTrack[];
  currentIndex: number;
  status: PlaybackStatus;
  repeatMode: RepeatMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  bufferedUntil: number;
  requestedSeek: number | null;
  error: string | null;
  playedTrackIds: string[];
  activeTrack: PlayerTrack | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  uiMode: "default" | "nightDrive" | "coding";
  sleepTimerEndsAt: number | null;
  jamMode: boolean;
  enableJamMode: () => void;
  disableJamMode: () => void;
  appendRecommendedIfNeeded: () => Promise<void>;
  eqEnabled: boolean;
  eqBands: Record<string, number>;
  setEqEnabled: (enabled: boolean) => void;
  setEqBand: (frequencyHz: number, gainDb: number) => void;
  resetEq: () => void;
  setUiMode: (mode: PlayerState["uiMode"]) => void;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  enqueue: (track: PlayerTrack, mode?: QueueInsertMode) => void;
  enqueueMany: (tracks: PlayerTrack[], mode?: Exclude<QueueInsertMode, "play-next">) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  playTrack: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  commitSeek: () => void;
  setPlaybackSnapshot: (snapshot: {
    currentTime?: number;
    duration?: number;
    bufferedUntil?: number;
  }) => void;
  setStatus: (status: PlaybackStatus) => void;
  setError: (message: string | null) => void;
  setTrackStreamUrl: (trackId: string, streamUrl: string) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  markTrackStarted: (trackId: string) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRandomNextIndex(queueLength: number, currentIndex: number) {
  if (queueLength <= 1) {
    return currentIndex;
  }

  const candidates = Array.from({ length: queueLength }, (_, index) => index).filter(
    (index) => index !== currentIndex
  );

  return candidates[Math.floor(Math.random() * candidates.length)] ?? currentIndex;
}

function deriveNavigation(state: Pick<PlayerState, "queue" | "currentIndex" | "repeatMode">) {
  const hasQueue = state.queue.length > 0;
  const hasPrevious = hasQueue && (state.currentIndex > 0 || state.repeatMode === "all");
  const hasNext =
    hasQueue && (state.currentIndex < state.queue.length - 1 || state.repeatMode === "all");

  return {
    activeTrack: hasQueue ? state.queue[state.currentIndex] ?? null : null,
    canGoPrevious: hasPrevious,
    canGoNext: hasNext
  };
}

export const usePlayerStore = create<PlayerState>()(
  devtools(
    persist(
      (set, get) => ({
        queue: [],
        currentIndex: -1,
        status: "idle",
        repeatMode: "none",
        shuffle: false,
        volume: 0.85,
        muted: false,
        currentTime: 0,
        duration: 0,
        bufferedUntil: 0,
        requestedSeek: null,
        error: null,
        playedTrackIds: [],
        activeTrack: null,
        canGoPrevious: false,
        canGoNext: false,
        uiMode: "default",
        sleepTimerEndsAt: null,
        jamMode: false,
        eqEnabled: false,
        eqBands: {
          60: 0,
          170: 0,
          310: 0,
          600: 0,
          1000: 0,
          3000: 0,
          6000: 0,
          12000: 0,
          14000: 0
        },

        enableJamMode() {
          set({ jamMode: true });
        },

        disableJamMode() {
          set({ jamMode: false });
        },

        async appendRecommendedIfNeeded() {
          const state = get();
          if (!state.jamMode || !state.activeTrack) {
            return;
          }

          const remaining = state.queue.length - (state.currentIndex + 1);
          if (remaining >= 2) {
            return;
          }

          const exclude = new Set(state.queue.map((t) => t.id));
          const url = new URL("/api/recommendations", window.location.origin);
          url.searchParams.set("title", state.activeTrack.title);
          url.searchParams.set("artist", state.activeTrack.artist);
          url.searchParams.set("limit", "12");
          for (const id of exclude) {
            url.searchParams.append("exclude", id);
          }

          const response = await fetch(url.toString());
          const body = (await response.json()) as { tracks?: PlayerTrack[] };
          const tracks = Array.isArray(body.tracks) ? body.tracks : [];
          const filtered = tracks.filter((track) => track && !exclude.has(track.id));
          if (filtered.length === 0) {
            return;
          }

          get().enqueueMany(filtered, "append");
        },

        setEqEnabled(enabled) {
          set({ eqEnabled: enabled });
        },

        setEqBand(frequencyHz, gainDb) {
          const key = String(Math.round(frequencyHz));
          const safeGain = clamp(gainDb, -12, 12);
          set((state) => ({
            eqBands: {
              ...state.eqBands,
              [key]: safeGain
            }
          }));
        },

        resetEq() {
          set({
            eqBands: {
              60: 0,
              170: 0,
              310: 0,
              600: 0,
              1000: 0,
              3000: 0,
              6000: 0,
              12000: 0,
              14000: 0
            }
          });
        },

        setUiMode(mode) {
          set({ uiMode: mode });
        },

        setSleepTimer(minutes) {
          const safeMinutes = Math.min(Math.max(Math.floor(minutes), 1), 240);
          set({ sleepTimerEndsAt: Date.now() + safeMinutes * 60_000 });
        },

        cancelSleepTimer() {
          set({ sleepTimerEndsAt: null });
        },

        enqueue(track, mode = "append") {
          set((state) => {
            if (mode === "play-now" || state.currentIndex === -1) {
              const insertAt = state.currentIndex === -1 ? 0 : state.currentIndex + 1;
              const queue = [...state.queue];
              queue.splice(insertAt, 0, track);
              const nextState = {
                ...state,
                queue,
                currentIndex: insertAt,
                status: "playing" as PlaybackStatus,
                currentTime: 0,
                duration: track.durationSeconds,
                bufferedUntil: 0,
                error: null
              };

              return { ...nextState, ...deriveNavigation(nextState) };
            }

            if (mode === "play-next") {
              const queue = [...state.queue];
              queue.splice(state.currentIndex + 1, 0, track);
              const nextState = { ...state, queue };

              return { ...nextState, ...deriveNavigation(nextState) };
            }

            const nextState = { ...state, queue: [...state.queue, track] };
            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        enqueueMany(tracks, mode = "append") {
          if (tracks.length === 0) {
            return;
          }

          set((state) => {
            const shouldStart = mode === "play-now" || state.currentIndex === -1;
            const queue = shouldStart ? tracks : [...state.queue, ...tracks];
            const currentIndex = shouldStart ? 0 : state.currentIndex;
            const activeTrack = queue[currentIndex] ?? null;
            const nextState = {
              ...state,
              queue,
              currentIndex,
              status: shouldStart ? ("playing" as PlaybackStatus) : state.status,
              currentTime: shouldStart ? 0 : state.currentTime,
              duration: shouldStart ? activeTrack?.durationSeconds ?? 0 : state.duration,
              bufferedUntil: shouldStart ? 0 : state.bufferedUntil,
              error: null
            };

            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        playQueue(tracks, startIndex = 0) {
          if (tracks.length === 0) {
            get().clearQueue();
            return;
          }

          set((state) => {
            const currentIndex = clamp(startIndex, 0, tracks.length - 1);
            const activeTrack = tracks[currentIndex];
            const nextState = {
              ...state,
              queue: tracks,
              currentIndex,
              status: "playing" as PlaybackStatus,
              currentTime: 0,
              duration: activeTrack?.durationSeconds ?? 0,
              bufferedUntil: 0,
              error: null
            };

            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        playTrack(track) {
          get().enqueue(track, "play-now");
        },

        removeFromQueue(index) {
          set((state) => {
            if (index < 0 || index >= state.queue.length) {
              return state;
            }

            const queue = state.queue.filter((_, itemIndex) => itemIndex !== index);
            const removedActiveTrack = index === state.currentIndex;
            const currentIndex =
              queue.length === 0
                ? -1
                : removedActiveTrack
                  ? clamp(index, 0, queue.length - 1)
                  : index < state.currentIndex
                    ? state.currentIndex - 1
                    : state.currentIndex;
            const activeTrack = currentIndex >= 0 ? queue[currentIndex] : null;
            const nextState = {
              ...state,
              queue,
              currentIndex,
              status: queue.length === 0 ? ("idle" as PlaybackStatus) : state.status,
              currentTime: removedActiveTrack ? 0 : state.currentTime,
              duration: removedActiveTrack ? activeTrack?.durationSeconds ?? 0 : state.duration,
              bufferedUntil: removedActiveTrack ? 0 : state.bufferedUntil
            };

            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        clearQueue() {
          set((state) => ({
            ...state,
            queue: [],
            currentIndex: -1,
            status: "idle",
            currentTime: 0,
            duration: 0,
            bufferedUntil: 0,
            requestedSeek: null,
            error: null,
            activeTrack: null,
            canGoPrevious: false,
            canGoNext: false
          }));
        },

        moveQueueItem(fromIndex, toIndex) {
          set((state) => {
            if (
              fromIndex < 0 ||
              fromIndex >= state.queue.length ||
              toIndex < 0 ||
              toIndex >= state.queue.length ||
              fromIndex === toIndex
            ) {
              return state;
            }

            const queue = [...state.queue];
            const [item] = queue.splice(fromIndex, 1);
            if (!item) {
              return state;
            }
            queue.splice(toIndex, 0, item);

            let currentIndex = state.currentIndex;
            if (fromIndex === state.currentIndex) {
              currentIndex = toIndex;
            } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
              currentIndex -= 1;
            } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
              currentIndex += 1;
            }

            const nextState = { ...state, queue, currentIndex };
            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        play() {
          set((state) => ({
            ...state,
            status: state.activeTrack ? "playing" : state.status,
            error: null
          }));
        },

        pause() {
          set((state) => ({
            ...state,
            status: state.status === "idle" ? "idle" : "paused"
          }));
        },

        togglePlayback() {
          const status = get().status;
          if (status === "playing" || status === "loading") {
            get().pause();
          } else {
            get().play();
          }
        },

        next() {
          set((state) => {
            if (state.queue.length === 0 || state.currentIndex === -1) {
              return state;
            }

            if (state.repeatMode === "one") {
              return { ...state, currentTime: 0, requestedSeek: 0, status: "playing" };
            }

            const lastIndex = state.queue.length - 1;
            const nextIndex = state.shuffle
              ? getRandomNextIndex(state.queue.length, state.currentIndex)
              : state.currentIndex + 1;

            if (nextIndex > lastIndex) {
              if (state.repeatMode !== "all") {
                return { ...state, status: "paused", currentTime: state.duration };
              }

              const loopedState = {
                ...state,
                currentIndex: 0,
                status: "playing" as PlaybackStatus,
                currentTime: 0,
                duration: state.queue[0]?.durationSeconds ?? 0,
                bufferedUntil: 0,
                error: null
              };

              return { ...loopedState, ...deriveNavigation(loopedState) };
            }

            const nextState = {
              ...state,
              currentIndex: nextIndex,
              status: "playing" as PlaybackStatus,
              currentTime: 0,
              duration: state.queue[nextIndex]?.durationSeconds ?? 0,
              bufferedUntil: 0,
              error: null
            };

            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        previous() {
          set((state) => {
            if (state.queue.length === 0 || state.currentIndex === -1) {
              return state;
            }

            if (state.currentTime > 3) {
              return { ...state, currentTime: 0, requestedSeek: 0 };
            }

            const previousIndex = state.currentIndex - 1;
            if (previousIndex < 0 && state.repeatMode !== "all") {
              return { ...state, currentTime: 0, requestedSeek: 0 };
            }

            const currentIndex = previousIndex < 0 ? state.queue.length - 1 : previousIndex;
            const nextState = {
              ...state,
              currentIndex,
              status: "playing" as PlaybackStatus,
              currentTime: 0,
              duration: state.queue[currentIndex]?.durationSeconds ?? 0,
              bufferedUntil: 0,
              error: null
            };

            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        seek(seconds) {
          const duration = get().duration || get().activeTrack?.durationSeconds || 0;
          const currentTime = clamp(seconds, 0, duration || seconds);
          set({ currentTime, requestedSeek: currentTime });
        },

        commitSeek() {
          set({ requestedSeek: null });
        },

        setPlaybackSnapshot(snapshot) {
          set((state) => ({
            currentTime: snapshot.currentTime ?? state.currentTime,
            duration: snapshot.duration ?? state.duration,
            bufferedUntil: snapshot.bufferedUntil ?? state.bufferedUntil
          }));
        },

        setStatus(status) {
          set({ status });
        },

        setError(message) {
          set({ error: message, status: message ? "error" : get().status });
        },

        setTrackStreamUrl(trackId, streamUrl) {
          const normalizedTrackId = trackId.trim();
          const normalizedStreamUrl = streamUrl.trim();
          if (!normalizedTrackId || !normalizedStreamUrl) {
            return;
          }

          set((state) => {
            let queueChanged = false;
            const queue = state.queue.map((track) => {
              if (track.id !== normalizedTrackId || track.streamUrl === normalizedStreamUrl) {
                return track;
              }

              queueChanged = true;
              return { ...track, streamUrl: normalizedStreamUrl };
            });

            if (!queueChanged) {
              return state;
            }

            const nextState = { ...state, queue };
            return { ...nextState, ...deriveNavigation(nextState), error: null };
          });
        },

        setVolume(volume) {
          set({ volume: clamp(volume, 0, 1), muted: volume === 0 ? true : get().muted });
        },

        toggleMute() {
          set((state) => ({ muted: !state.muted }));
        },

        toggleShuffle() {
          set((state) => ({ shuffle: !state.shuffle }));
        },

        setRepeatMode(mode) {
          set((state) => {
            const nextState = { ...state, repeatMode: mode };
            return { ...nextState, ...deriveNavigation(nextState) };
          });
        },

        cycleRepeatMode() {
          const current = get().repeatMode;
          const next = current === "none" ? "all" : current === "all" ? "one" : "none";
          get().setRepeatMode(next);
        },

        markTrackStarted(trackId) {
          set((state) => ({
            playedTrackIds: [trackId, ...state.playedTrackIds.filter((id) => id !== trackId)].slice(
              0,
              100
            )
          }));
        }
      }),
      {
        name: "muzicblast-player",
        partialize: (state) => ({
          queue: state.queue,
          currentIndex: state.currentIndex,
          repeatMode: state.repeatMode,
          shuffle: state.shuffle,
          volume: state.volume,
          muted: state.muted,
          playedTrackIds: state.playedTrackIds,
          uiMode: state.uiMode,
          jamMode: state.jamMode,
          eqEnabled: state.eqEnabled,
          eqBands: state.eqBands
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) {
            return;
          }

          const derived = deriveNavigation(state);
          state.activeTrack = derived.activeTrack;
          state.canGoPrevious = derived.canGoPrevious;
          state.canGoNext = derived.canGoNext;
          state.status = "idle";
          state.currentTime = 0;
          state.duration = derived.activeTrack?.durationSeconds ?? 0;
          state.bufferedUntil = 0;
          state.requestedSeek = null;
          state.error = null;
          state.sleepTimerEndsAt = null;
        }
      }
    ),
    { name: "MuzicBlast Player" }
  )
);
