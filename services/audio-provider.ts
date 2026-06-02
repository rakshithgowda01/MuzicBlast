export interface AudioStream {
  trackId: string;
  streamUrl: string;
  mimeType: string;
  expiresAt: Date;
}

export interface AudioProvider {
  resolveStream(trackId: string): Promise<AudioStream>;
}
