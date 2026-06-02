export interface LyricsLine {
  timeSeconds?: number;
  text: string;
}

export interface LyricsProvider {
  getLyrics(track: { title: string; artist: string }): Promise<LyricsLine[]>;
}
