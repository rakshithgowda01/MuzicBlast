import * as fs from "node:fs/promises";
import * as path from "node:path";

import { prisma } from "@/lib/prisma";
import { createYouTubeProvider } from "@/server/providers/youtube-provider";
import { inferMimeTypeFromExt } from "@/server/downloads/mime";
import { YtDlpClient } from "@/server/yt-dlp/client";

export class DownloadsService {
  private readonly provider = createYouTubeProvider();
  private readonly ytDlp = new YtDlpClient();

  getDownloadsDir() {
    return path.join(process.cwd(), ".data", "downloads");
  }

  async list() {
    return prisma.download.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        track: true
      }
    });
  }

  async startDownload(trackId: string) {
    const id = trackId.trim();
    if (!id) {
      throw new Error("trackId is required.");
    }

    const downloadsDir = this.getDownloadsDir();

    await prisma.download.upsert({
      where: { trackId: id },
      update: {
        status: "downloading",
        error: null,
        startedAt: new Date(),
        completedAt: null
      },
      create: {
        trackId: id,
        filePath: "",
        mimeType: "application/octet-stream",
        sizeBytes: 0,
        status: "downloading",
        startedAt: new Date()
      }
    });

    const { filePath } = await this.ytDlp.downloadAudio(id, downloadsDir);
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).replace(".", "");

    const stream = await this.provider.resolveStream(id);
    const mimeType = ext ? inferMimeTypeFromExt(ext) : stream.mimeType;

    const updated = await prisma.download.update({
      where: { trackId: id },
      data: {
        filePath,
        mimeType,
        sizeBytes: stat.size,
        status: "completed",
        completedAt: new Date(),
        error: null
      }
    });

    return updated;
  }

  async remove(trackId: string) {
    const id = trackId.trim();
    if (!id) {
      throw new Error("trackId is required.");
    }

    const existing = await prisma.download.findUnique({ where: { trackId: id } });
    if (!existing) {
      return { removed: false };
    }

    if (existing.filePath) {
      await fs.rm(existing.filePath, { force: true });
    }

    await prisma.download.delete({ where: { trackId: id } });
    return { removed: true };
  }

  async getCompleted(trackId: string) {
    const id = trackId.trim();
    if (!id) return null;
    return prisma.download.findFirst({
      where: { trackId: id, status: "completed" }
    });
  }

  async openFileStream(trackId: string) {
    const completed = await this.getCompleted(trackId);
    if (!completed?.filePath) {
      return null;
    }
    return { completed, filePath: completed.filePath };
  }
}

