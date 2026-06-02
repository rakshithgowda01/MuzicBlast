"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface HistoryTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  track: HistoryTrack;
}

export interface HistoryInput {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
}

const HISTORY_QUERY_KEY = ["history"] as const;

async function fetchHistory() {
  const response = await fetch("/api/history");
  const body = (await response.json()) as { history?: HistoryEntry[]; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Failed to load history.");
  }
  return body.history ?? [];
}

async function recordHistory(input: HistoryInput) {
  const response = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = (await response.json()) as { history?: HistoryEntry; error?: { message?: string } };
  if (!response.ok || !body.history) {
    throw new Error(body.error?.message ?? "Failed to record history.");
  }
  return body.history;
}

export function useHistory() {
  return useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: fetchHistory
  });
}

export function useHistoryActions() {
  const queryClient = useQueryClient();

  const recordHistoryMutation = useMutation({
    mutationFn: recordHistory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
    }
  });

  return {
    recordHistory: recordHistoryMutation.mutateAsync,
    recording: recordHistoryMutation.isPending
  };
}
