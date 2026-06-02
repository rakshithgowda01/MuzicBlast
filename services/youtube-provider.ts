import type { AudioProvider } from "@/services/audio-provider";
import type { LyricsProvider } from "@/services/lyrics-provider";
import type { SearchProvider } from "@/services/search-provider";

export interface YouTubeProvider extends SearchProvider, AudioProvider, LyricsProvider {}
