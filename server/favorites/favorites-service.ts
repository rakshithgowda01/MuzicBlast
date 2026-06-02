import { prisma } from "@/lib/prisma";

export interface FavoriteSongInput {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

function sanitize(input: FavoriteSongInput) {
  return {
    videoId: input.videoId.trim(),
    title: input.title.trim(),
    artist: input.artist.trim(),
    thumbnail: input.thumbnail.trim()
  };
}

export class FavoritesService {
  async list() {
    return prisma.favoriteSong.findMany({
      orderBy: { addedAt: "desc" }
    });
  }

  async add(input: FavoriteSongInput) {
    const value = sanitize(input);
    if (!value.videoId || !value.title || !value.artist) {
      throw new Error("videoId, title, and artist are required.");
    }

    return prisma.favoriteSong.upsert({
      where: { videoId: value.videoId },
      update: {
        title: value.title,
        artist: value.artist,
        thumbnail: value.thumbnail
      },
      create: value
    });
  }

  async remove(videoId: string) {
    const id = videoId.trim();
    if (!id) {
      throw new Error("videoId is required.");
    }

    try {
      await prisma.favoriteSong.delete({
        where: { videoId: id }
      });
    } catch {
      return { removed: false };
    }

    return { removed: true };
  }
}
