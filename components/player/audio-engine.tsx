"use client";

import * as React from "react";

import { useAudioEngine } from "@/hooks/use-audio-engine";

export function AudioEngine() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  useAudioEngine(audioRef);

  return <audio ref={audioRef} preload="metadata" />;
}
