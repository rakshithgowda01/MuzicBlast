"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface DownloadRecord {
  id: string;
  trackId: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  track?: {
    id: string;
    title: string;
    artist: string;
    durationSeconds: number;
    thumbnailUrl: string;
    sourceUrl: string;
  };
}

export interface DownloadInput {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
}

const DOWNLOADS_QUERY_KEY = ["downloads"] as const;

async function fetchDownloads() {
  const response = await fetch("/api/downloads");
  const body = (await response.json()) as { downloads?: DownloadRecord[]; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Failed to load downloads.");
  }
  return body.downloads ?? [];
}

async function startDownload(input: DownloadInput) {
  const response = await fetch("/api/downloads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackId: input.id,
      title: input.title,
      artist: input.artist,
      durationSeconds: input.durationSeconds,
      thumbnailUrl: input.thumbnailUrl
    })
  });
  const body = (await response.json()) as { download?: DownloadRecord; error?: { message?: string } };
  if (!response.ok || !body.download) {
    throw new Error(body.error?.message ?? "Failed to start download.");
  }
  return body.download;
}

async function removeDownload(trackId: string) {
  const response = await fetch(`/api/downloads/${encodeURIComponent(trackId)}`, { method: "DELETE" });
  const body = (await response.json()) as { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Failed to remove download.");
  }
}

export function useDownloads() {
  return useQuery({ queryKey: DOWNLOADS_QUERY_KEY, queryFn: fetchDownloads });
}

export function useDownloadActions() {
  const queryClient = useQueryClient();

  const start = useMutation({
    mutationFn: startDownload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOWNLOADS_QUERY_KEY })
  });

  const remove = useMutation({
    mutationFn: removeDownload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOWNLOADS_QUERY_KEY })
  });

  return {
    startDownload: start.mutateAsync,
    removeDownload: remove.mutateAsync,
    starting: start.isPending,
    removing: remove.isPending
  };
}
