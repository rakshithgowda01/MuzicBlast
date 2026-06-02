import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

import { YtDlpError } from "@/server/yt-dlp/errors";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 40_000;
const DEFAULT_MAX_BUFFER = 1024 * 1024 * 8;

export interface YtDlpClientOptions {
  binaryPath?: string;
  timeoutMs?: number;
}

export interface YtDlpSearchEntry {
  id?: unknown;
  title?: unknown;
  channel?: unknown;
  uploader?: unknown;
  duration?: unknown;
  thumbnails?: unknown;
  thumbnail?: unknown;
  webpage_url?: unknown;
  url?: unknown;
}

interface YtDlpSearchResponse {
  entries?: unknown;
}

interface YtDlpStreamResponse {
  url?: unknown;
  ext?: unknown;
}

function getBinaryPath(binaryPath?: string) {
  return binaryPath || process.env.YTDLP_PATH || "yt-dlp";
}

function parseJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch {
    throw new YtDlpError("yt-dlp returned invalid JSON.", "INVALID_RESPONSE");
  }
}

function inferMimeTypeFromExt(ext: string) {
  const normalized = ext.trim().toLowerCase();
  switch (normalized) {
    case "m4a":
      return "audio/mp4";
    case "mp3":
      return "audio/mpeg";
    case "webm":
      return "audio/webm";
    case "opus":
      return "audio/opus";
    case "ogg":
      return "audio/ogg";
    case "aac":
      return "audio/aac";
    case "wav":
      return "audio/wav";
    default:
      return "audio/mpeg";
  }
}

export class YtDlpClient {
  private readonly binaryPath: string;
  private readonly timeoutMs: number;

  constructor(options: YtDlpClientOptions = {}) {
    this.binaryPath = getBinaryPath(options.binaryPath);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async search(query: string, limit: number): Promise<YtDlpSearchEntry[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const args = [
      "--dump-single-json",
      "--skip-download",
      "--no-warnings",
      "--flat-playlist",
      `ytsearch${limit}:${trimmedQuery}`
    ];

    try {
      const { stdout } = await execFileAsync(this.binaryPath, args, {
        timeout: this.timeoutMs,
        maxBuffer: DEFAULT_MAX_BUFFER,
        windowsHide: true
      });
      const parsed = parseJson(stdout) as YtDlpSearchResponse;

      if (!Array.isArray(parsed.entries)) {
        throw new YtDlpError("yt-dlp search response did not contain entries.", "INVALID_RESPONSE");
      }

      return parsed.entries as YtDlpSearchEntry[];
    } catch (error) {
      if (error instanceof YtDlpError) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
      if (nodeError.code === "ENOENT") {
        throw new YtDlpError(
          `Unable to find yt-dlp executable at "${this.binaryPath}". Set YTDLP_PATH in .env.`,
          "NOT_FOUND"
        );
      }

      const stderr = typeof nodeError.stderr === "string" ? nodeError.stderr.trim() : "";
      const reason = stderr || nodeError.message || "yt-dlp search failed.";
      throw new YtDlpError(reason, "FAILED");
    }
  }

  async resolveStream(trackId: string): Promise<{ trackId: string; streamUrl: string; mimeType: string }> {
    const normalizedTrackId = trackId.trim();
    if (!normalizedTrackId) {
      throw new YtDlpError("Track id is required to resolve stream.", "INVALID_RESPONSE");
    }

    const sourceUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(normalizedTrackId)}`;
    const args = [
      "--dump-single-json",
      "--skip-download",
      "--no-warnings",
      "--no-playlist",
      "-f",
      "bestaudio/best",
      sourceUrl
    ];

    try {
      const { stdout } = await execFileAsync(this.binaryPath, args, {
        timeout: this.timeoutMs,
        maxBuffer: DEFAULT_MAX_BUFFER,
        windowsHide: true
      });
      const parsed = parseJson(stdout) as YtDlpStreamResponse;
      const streamUrl = typeof parsed.url === "string" ? parsed.url.trim() : "";
      if (!streamUrl) {
        throw new YtDlpError("yt-dlp stream response did not contain a direct stream URL.", "INVALID_RESPONSE");
      }

      const ext = typeof parsed.ext === "string" ? parsed.ext.trim() : "";
      return {
        trackId: normalizedTrackId,
        streamUrl,
        mimeType: inferMimeTypeFromExt(ext)
      };
    } catch (error) {
      if (error instanceof YtDlpError) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
      if (nodeError.code === "ENOENT") {
        throw new YtDlpError(
          `Unable to find yt-dlp executable at "${this.binaryPath}". Set YTDLP_PATH in .env.`,
          "NOT_FOUND"
        );
      }

      const stderr = typeof nodeError.stderr === "string" ? nodeError.stderr.trim() : "";
      const reason = stderr || nodeError.message || "yt-dlp stream resolve failed.";
      throw new YtDlpError(reason, "FAILED");
    }
  }

  async downloadAudio(trackId: string, outputDir: string): Promise<{ filePath: string }> {
    const normalizedTrackId = trackId.trim();
    if (!normalizedTrackId) {
      throw new YtDlpError("Track id is required to download audio.", "INVALID_RESPONSE");
    }

    const resolvedOutputDir = path.resolve(outputDir);
    await fs.mkdir(resolvedOutputDir, { recursive: true });

    const sourceUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(normalizedTrackId)}`;
    const outputTemplate = path.join(resolvedOutputDir, `${normalizedTrackId}.%(ext)s`);

    const args = [
      "--no-warnings",
      "--no-playlist",
      "--no-progress",
      "-f",
      "bestaudio/best",
      "-o",
      outputTemplate,
      sourceUrl
    ];

    try {
      await execFileAsync(this.binaryPath, args, {
        timeout: 1000 * 60 * 10,
        maxBuffer: DEFAULT_MAX_BUFFER,
        windowsHide: true
      });

      const files = await fs.readdir(resolvedOutputDir);
      const match = files.find((file) => file.startsWith(`${normalizedTrackId}.`));
      if (!match) {
        throw new YtDlpError("yt-dlp download completed but output file was not found.", "INVALID_RESPONSE");
      }

      return { filePath: path.join(resolvedOutputDir, match) };
    } catch (error) {
      if (error instanceof YtDlpError) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
      if (nodeError.code === "ENOENT") {
        throw new YtDlpError(
          `Unable to find yt-dlp executable at "${this.binaryPath}". Set YTDLP_PATH in .env.`,
          "NOT_FOUND"
        );
      }

      const stderr = typeof nodeError.stderr === "string" ? nodeError.stderr.trim() : "";
      const reason = stderr || nodeError.message || "yt-dlp download failed.";
      throw new YtDlpError(reason, "FAILED");
    }
  }
}
