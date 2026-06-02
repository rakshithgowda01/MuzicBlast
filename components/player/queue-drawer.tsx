"use client";

import { ArrowDown, ArrowUp, GripVertical, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/components/player/format-time";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";

export function QueueDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="ml-auto flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#08080a] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Queue</h2>
            <p className="text-sm text-muted-foreground">{queue.length} tracks ready</p>
          </div>
          <Button aria-label="Close queue" size="icon" variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {queue.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Your queue is empty.
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-2 py-2",
                    index === currentIndex ? "bg-white/10" : "hover:bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GripVertical className="size-4" />
                    <span className="w-6 text-right text-xs">{index + 1}</span>
                  </div>
                  <button
                    className="min-w-0 text-left"
                    type="button"
                    onClick={() => playQueue(queue, index)}
                  >
                    <p className="truncate text-sm font-medium">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist} / {formatTime(track.durationSeconds)}
                    </p>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      aria-label="Move track up"
                      disabled={index === 0}
                      size="icon"
                      variant="ghost"
                      onClick={() => moveQueueItem(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      aria-label="Move track down"
                      disabled={index === queue.length - 1}
                      size="icon"
                      variant="ghost"
                      onClick={() => moveQueueItem(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      aria-label="Remove track"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFromQueue(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {queue.length > 0 ? (
          <footer className="border-t border-white/10 p-4">
            <Button className="w-full" variant="outline" onClick={clearQueue}>
              Clear queue
            </Button>
          </footer>
        ) : null}
      </motion.aside>
    </div>
  );
}
