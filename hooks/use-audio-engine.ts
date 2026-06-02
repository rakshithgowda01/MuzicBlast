"use client";

import * as React from "react";
import type { SearchTrack } from "@/services/search-provider";

import { usePlayerStore } from "@/stores/player-store";

function getBufferedUntil(audio: HTMLAudioElement) {
  if (audio.buffered.length === 0) {
    return 0;
  }

  return audio.buffered.end(audio.buffered.length - 1);
}

export function useAudioEngine(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const status = usePlayerStore((state) => state.status);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const sleepTimerEndsAt = usePlayerStore((state) => state.sleepTimerEndsAt);
  const cancelSleepTimer = usePlayerStore((state) => state.cancelSleepTimer);
  const eqEnabled = usePlayerStore((state) => state.eqEnabled);
  const eqBands = usePlayerStore((state) => state.eqBands);
  const requestedSeek = usePlayerStore((state) => state.requestedSeek);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const setError = usePlayerStore((state) => state.setError);
  const setTrackStreamUrl = usePlayerStore((state) => state.setTrackStreamUrl);
  const setPlaybackSnapshot = usePlayerStore((state) => state.setPlaybackSnapshot);
  const commitSeek = usePlayerStore((state) => state.commitSeek);
  const next = usePlayerStore((state) => state.next);
  const markTrackStarted = usePlayerStore((state) => state.markTrackStarted);
  const eqGraphAllowed = Boolean(
    eqEnabled &&
      activeTrack?.streamUrl &&
      (activeTrack.streamUrl.startsWith("/") ||
        (typeof window !== "undefined" && activeTrack.streamUrl.startsWith(window.location.origin)))
  );

  const [sleepMultiplier, setSleepMultiplier] = React.useState(1);

  const audioGraphRef = React.useRef<{
    ctx: AudioContext;
    source: MediaElementAudioSourceNode;
    filters: Map<string, BiquadFilterNode>;
    gain: GainNode;
  } | null>(null);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const ensureGraph = () => {
      if (audioGraphRef.current) {
        return audioGraphRef.current;
      }

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = 1;

      const filters = new Map<string, BiquadFilterNode>();
      const freqs = Object.keys(eqBands);
      for (const key of freqs) {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = Number(key);
        filter.Q.value = 1.1;
        filter.gain.value = 0;
        filters.set(key, filter);
      }

      // Chain: source -> filters... -> gain -> destination
      let node: AudioNode = source;
      for (const filter of filters.values()) {
        node.connect(filter);
        node = filter;
      }
      node.connect(gain);
      gain.connect(ctx.destination);

      audioGraphRef.current = { ctx, source, filters, gain };
      return audioGraphRef.current;
    };

    // Only create the AudioContext once playback is actually requested.
    if (!eqGraphAllowed) {
      return;
    }

    if (status === "playing" || status === "loading") {
      const graph = ensureGraph();
      void graph.ctx.resume();
      // We control loudness via GainNode, keep media element volume stable.
      audio.volume = 1;
      audio.muted = false;
    }
  }, [audioRef, eqBands, eqGraphAllowed, status]);

  React.useEffect(() => {
    const graph = audioGraphRef.current;
    if (!graph || !eqGraphAllowed) {
      return;
    }

    for (const [key, filter] of graph.filters) {
      const gain = Number(eqBands[key] ?? 0);
      filter.gain.value = gain;
    }
  }, [eqBands, eqGraphAllowed]);

  React.useEffect(() => {
    if (eqGraphAllowed) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = muted ? 0 : volume * sleepMultiplier;
    audio.muted = false;
  }, [audioRef, eqGraphAllowed, muted, sleepMultiplier, volume]);

  React.useEffect(() => {
    const graph = audioGraphRef.current;
    if (!graph || !eqGraphAllowed) {
      return;
    }

    graph.gain.gain.value = (muted ? 0 : volume) * sleepMultiplier;
  }, [eqGraphAllowed, muted, sleepMultiplier, volume]);

  React.useEffect(() => {
    const trackId = activeTrack?.id;
    const streamUrl = activeTrack?.streamUrl;
    if (!trackId || streamUrl) {
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    fetch(`/api/stream?trackId=${encodeURIComponent(trackId)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as {
          trackId?: string;
          streamUrl?: string;
          error?: { message?: string };
        };

        if (!response.ok || !body.streamUrl) {
          throw new Error(body.error?.message ?? "Failed to resolve track stream.");
        }

        setTrackStreamUrl(trackId, body.streamUrl);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to resolve track stream.";
        setError(message);
      });

    return () => {
      controller.abort();
    };
  }, [activeTrack?.id, activeTrack?.streamUrl, setError, setStatus, setTrackStreamUrl]);

  React.useEffect(() => {
    if (sleepTimerEndsAt === null) {
      setSleepMultiplier(1);
      return;
    }

    const fadeSeconds = 12;
    const tick = () => {
      const remainingMs = sleepTimerEndsAt - Date.now();
      if (remainingMs <= 0) {
        cancelSleepTimer();
        setSleepMultiplier(1);
        usePlayerStore.getState().setStatus("paused");
        return;
      }

      const remainingSeconds = remainingMs / 1000;
      if (remainingSeconds <= fadeSeconds) {
        const ratio = Math.max(remainingSeconds / fadeSeconds, 0);
        setSleepMultiplier(ratio);
        return;
      }

      setSleepMultiplier(1);
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [cancelSleepTimer, sleepTimerEndsAt]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || requestedSeek === null) {
      return;
    }

    audio.currentTime = requestedSeek;
    commitSeek();
  }, [audioRef, commitSeek, requestedSeek]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const streamUrl = activeTrack?.streamUrl;
    if (!activeTrack) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (!streamUrl) {
      audio.removeAttribute("src");
      audio.load();
      setError("This track does not have a resolved audio stream yet.");
      return;
    }

    if (audio.src !== streamUrl) {
      setStatus("loading");
      audio.src = streamUrl;
      audio.load();
      markTrackStarted(activeTrack.id);

      // Record to SQLite play history database
      void fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeTrack.id,
          title: activeTrack.title,
          artist: activeTrack.artist,
          durationSeconds: activeTrack.durationSeconds,
          thumbnailUrl: activeTrack.thumbnailUrl
        })
      }).catch(() => {});
    }
  }, [activeTrack, audioRef, markTrackStarted, setError, setStatus]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (status === "playing") {
      const playPromise = audio.play();
      playPromise.catch(() => {
        setError("Playback could not start. The browser may require a user gesture.");
      });
    }

    if (status === "paused" || status === "idle" || status === "error") {
      audio.pause();
    }
  }, [audioRef, setError, status]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const syncSnapshot = () => {
      setPlaybackSnapshot({
        currentTime: audio.currentTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : activeTrack?.durationSeconds,
        bufferedUntil: getBufferedUntil(audio)
      });
    };

    const handleCanPlay = () => {
      setPlaybackSnapshot({
        duration: Number.isFinite(audio.duration) ? audio.duration : activeTrack?.durationSeconds,
        bufferedUntil: getBufferedUntil(audio)
      });

      if (usePlayerStore.getState().status === "loading") {
        setStatus("playing");
      }
    };

    const handlePlay = () => setStatus("playing");
    const handlePause = () => {
      if (!audio.ended && usePlayerStore.getState().status === "playing") {
        setStatus("paused");
      }
    };
    const handleEnded = () => {
      // User-requested behavior: after a track ends, automatically start a random next song.
      void fetch("/api/mixes?type=smart&limit=20")
        .then(async (response) => {
          const body = (await response.json()) as { tracks?: SearchTrack[] };
          const tracks = body.tracks ?? [];
          if (tracks.length === 0) {
            next();
            return;
          }
          const random = tracks[Math.floor(Math.random() * tracks.length)];
          if (!random) {
            next();
            return;
          }
          usePlayerStore.getState().playTrack(random);
        })
        .catch(() => {
          next();
        });
    };
    const handleWaiting = () => {
      if (usePlayerStore.getState().status === "playing") {
        setStatus("loading");
      }
    };
    const handleError = () => setError("The audio stream failed to load.");

    audio.addEventListener("timeupdate", syncSnapshot);
    audio.addEventListener("progress", syncSnapshot);
    audio.addEventListener("durationchange", syncSnapshot);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("playing", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", syncSnapshot);
      audio.removeEventListener("progress", syncSnapshot);
      audio.removeEventListener("durationchange", syncSnapshot);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("playing", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [activeTrack?.durationSeconds, audioRef, next, setError, setPlaybackSnapshot, setStatus]);
}
