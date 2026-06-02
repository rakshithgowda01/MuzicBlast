"use client";

import { Heart, Loader2 } from "lucide-react";

import { FavoritesGrid } from "@/components/favorites/favorites-grid";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useFavoriteActions, useFavorites } from "@/hooks/use-favorites";
import { usePlayerStore } from "@/stores/player-store";

export default function FavoritesPage() {
  const playTrack = usePlayerStore((state) => state.playTrack);
  const favoritesQuery = useFavorites();
  const { removeFavorite } = useFavoriteActions();
  const favorites = favoritesQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Favorites"
        description="Your saved favorites are stored locally in SQLite and synced through the provider-backed API."
      />
      {favoritesQuery.isLoading ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-3 pt-5 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading favorites...
          </CardContent>
        </Card>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 items-center justify-center gap-3 pt-5 text-muted-foreground">
            <Heart className="size-5 text-primary" />
            Save songs from Search or the player to build your favorites collection.
          </CardContent>
        </Card>
      ) : (
        <FavoritesGrid
          favorites={favorites}
          onPlay={(track) => playTrack(track)}
          onRemove={(videoId) => {
            void removeFavorite(videoId);
          }}
        />
      )}
    </>
  );
}
