"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/player-store";

interface LyricsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LyricsDrawer({ open, onClose }: LyricsDrawerProps) {
  const activeTrack = usePlayerStore((state) => state.activeTrack);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [lines, setLines] = React.useState<{ text: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (!activeTrack) {
      setStatus("idle");
      setLines([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    fetch(
      `/api/lyrics?title=${encodeURIComponent(activeTrack.title)}&artist=${encodeURIComponent(
        activeTrack.artist
      )}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const body = (await response.json()) as {
          lines?: { text: string }[];
          error?: { message?: string };
        };
        if (!response.ok) {
          throw new Error(body.error?.message ?? "Failed to load lyrics.");
        }
        setLines(Array.isArray(body.lines) ? body.lines : []);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load lyrics.");
      });

    return () => controller.abort();
  }, [activeTrack?.artist, activeTrack?.title, open, activeTrack]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close lyrics"
            className="fixed inset-0 z-[86] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            data-lyrics-drawer="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="glass-panel fixed inset-x-3 bottom-4 z-[87] rounded-[30px] p-4 sm:inset-x-auto sm:right-6 sm:w-[420px]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lyrics</p>
                <p className="truncate text-sm font-medium">{activeTrack?.title ?? "No track selected"}</p>
              </div>
              <Button aria-label="Close lyrics" size="icon" variant="ghost" onClick={onClose}>
                <X />
              </Button>
            </div>
            {!activeTrack ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-muted-foreground">
                Select a track to view lyrics.
              </div>
            ) : status === "loading" ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-muted-foreground">
                Loading lyrics...
              </div>
            ) : status === "error" ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-muted-foreground">
                {error ?? "Failed to load lyrics."}
              </div>
            ) : lines.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-muted-foreground">
                No lyrics available.
              </div>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-sm">
                {lines.map((line, index) => (
                  <p key={`${index}-${line.text}`} className="leading-6 text-muted-foreground">
                    {line.text}
                  </p>
                ))}
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
