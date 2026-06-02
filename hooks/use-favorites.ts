"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface FavoriteSong {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
  addedAt: string;
}

export interface FavoriteSongInput {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

const FAVORITES_QUERY_KEY = ["favorites"] as const;

async function fetchFavorites() {
  const response = await fetch("/api/favorites");
  const body = (await response.json()) as { favorites?: FavoriteSong[]; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Failed to load favorites.");
  }
  return body.favorites ?? [];
}

async function createFavorite(input: FavoriteSongInput) {
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = (await response.json()) as { favorite?: FavoriteSong; error?: { message?: string } };
  if (!response.ok || !body.favorite) {
    throw new Error(body.error?.message ?? "Failed to add favorite.");
  }
  return body.favorite;
}

async function deleteFavorite(videoId: string) {
  const response = await fetch(`/api/favorites/${encodeURIComponent(videoId)}`, {
    method: "DELETE"
  });
  const body = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Failed to remove favorite.");
  }
}

function upsertFavorite(list: FavoriteSong[], input: FavoriteSongInput) {
  const existing = list.find((item) => item.videoId === input.videoId);
  const nowIso = new Date().toISOString();
  if (existing) {
    return list.map((item) => (item.videoId === input.videoId ? { ...item, ...input } : item));
  }

  return [
    {
      id: `optimistic-${input.videoId}`,
      addedAt: nowIso,
      ...input
    },
    ...list
  ];
}

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: fetchFavorites
  });
}

export function useFavoriteActions() {
  const queryClient = useQueryClient();

  const addFavoriteMutation = useMutation({
    mutationFn: createFavorite,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<FavoriteSong[]>(FAVORITES_QUERY_KEY) ?? [];
      queryClient.setQueryData<FavoriteSong[]>(FAVORITES_QUERY_KEY, upsertFavorite(previous, input));
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<FavoriteSong[]>(FAVORITES_QUERY_KEY, (current = []) =>
        upsertFavorite(
          current.filter((item) => item.videoId !== saved.videoId),
          {
            videoId: saved.videoId,
            title: saved.title,
            artist: saved.artist,
            thumbnail: saved.thumbnail
          }
        ).map((item) => (item.videoId === saved.videoId ? saved : item))
      );
    }
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: deleteFavorite,
    onMutate: async (videoId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = queryClient.getQueryData<FavoriteSong[]>(FAVORITES_QUERY_KEY) ?? [];
      queryClient.setQueryData<FavoriteSong[]>(
        FAVORITES_QUERY_KEY,
        previous.filter((item) => item.videoId !== videoId)
      );
      return { previous };
    },
    onError: (_error, _videoId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    }
  });

  return {
    addFavorite: addFavoriteMutation.mutateAsync,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    adding: addFavoriteMutation.isPending,
    removing: removeFavoriteMutation.isPending
  };
}
