"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FavoriteSong } from "@/hooks/use-favorites";
import type { PlayerTrack } from "@/lib/player-types";

interface FavoritesGridProps {
  favorites: FavoriteSong[];
  onPlay: (track: PlayerTrack) => void;
  onRemove: (videoId: string) => void;
}

function toPlayerTrack(song: FavoriteSong): PlayerTrack {
  return {
    id: song.videoId,
    title: song.title,
    artist: song.artist,
    durationSeconds: 0,
    thumbnailUrl: song.thumbnail,
    sourceUrl: `https://www.youtube.com/watch?v=${song.videoId}`
  };
}

export function FavoritesGrid({ favorites, onPlay, onRemove }: FavoritesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((song) => (
        <motion.article
          key={song.videoId}
          className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
          whileHover={{ y: -4 }}
        >
          <div className="relative aspect-square">
            {song.thumbnail ? (
              <Image alt="" className="object-cover" fill sizes="(max-width: 1280px) 50vw, 33vw" src={song.thumbnail} unoptimized />
            ) : null}
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 via-black/15 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
              <Button
                aria-label={`Play ${song.title}`}
                size="icon"
                variant="premium"
                onClick={() => onPlay(toPlayerTrack(song))}
              >
                <Play />
              </Button>
              <Button
                aria-label={`Remove ${song.title} from favorites`}
                size="icon"
                variant="ghost"
                onClick={() => onRemove(song.videoId)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <p className="truncate text-base font-medium">{song.title}</p>
            <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
