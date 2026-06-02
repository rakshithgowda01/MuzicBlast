"use client";

import * as React from "react";
import { Moon, SlidersHorizontal, Timer } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

const sleepPresetsMinutes = [10, 20, 30, 45, 60, 90] as const;

export default function SettingsPage() {
  const uiMode = usePlayerStore((state) => state.uiMode);
  const setUiMode = usePlayerStore((state) => state.setUiMode);
  const sleepTimerEndsAt = usePlayerStore((state) => state.sleepTimerEndsAt);
  const setSleepTimer = usePlayerStore((state) => state.setSleepTimer);
  const cancelSleepTimer = usePlayerStore((state) => state.cancelSleepTimer);
  const eqEnabled = usePlayerStore((state) => state.eqEnabled);
  const eqBands = usePlayerStore((state) => state.eqBands);
  const setEqEnabled = usePlayerStore((state) => state.setEqEnabled);
  const setEqBand = usePlayerStore((state) => state.setEqBand);
  const resetEq = usePlayerStore((state) => state.resetEq);

  const remainingMinutes = React.useMemo(() => {
    if (sleepTimerEndsAt === null) {
      return null;
    }
    const remainingMs = sleepTimerEndsAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 60_000) : 0;
  }, [sleepTimerEndsAt]);

  return (
    <>
      <PageHeader
        eyebrow="Controls"
        title="Settings"
        description="Tune playback, offline behavior, provider paths, equalizer settings, and sleep timer preferences."
      />
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Moon className="mb-3 size-5 text-primary" />
            <CardTitle>Modes</CardTitle>
            <CardDescription>Switch the UI vibe for night drives or focused work.</CardDescription>
          </CardHeader>
          <div className="grid gap-2 px-6 pb-6">
            {([
              { id: "default", label: "Default" },
              { id: "nightDrive", label: "Night Drive" },
              { id: "coding", label: "Coding" }
            ] as const).map((mode) => (
              <Button
                key={mode.id}
                variant={uiMode === mode.id ? "secondary" : "ghost"}
                className={cn("justify-start", uiMode === mode.id && "text-foreground")}
                onClick={() => setUiMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <Timer className="mb-3 size-5 text-primary" />
            <CardTitle>Sleep timer</CardTitle>
            <CardDescription>Fade out and stop playback after a selected duration.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {sleepPresetsMinutes.map((minutes) => (
                <Button key={minutes} variant="ghost" onClick={() => setSleepTimer(minutes)}>
                  {minutes}m
                </Button>
              ))}
              <Button
                variant="ghost"
                disabled={sleepTimerEndsAt === null}
                onClick={() => cancelSleepTimer()}
              >
                Cancel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {sleepTimerEndsAt === null
                ? "No timer active."
                : `Timer active — stopping in ~${remainingMinutes ?? "?"} min.`}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <SlidersHorizontal className="mb-3 size-5 text-primary" />
            <CardTitle>Equalizer</CardTitle>
            <CardDescription>Shape the sound with a lightweight 9-band EQ.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={eqEnabled ? "secondary" : "ghost"}
                onClick={() => setEqEnabled(!eqEnabled)}
              >
                {eqEnabled ? "EQ On" : "EQ Off"}
              </Button>
              <Button variant="ghost" onClick={() => resetEq()}>
                Reset
              </Button>
            </div>
            <div className="grid gap-3">
              {Object.keys(eqBands)
                .map((key) => Number(key))
                .sort((a, b) => a - b)
                .map((frequency) => {
                  const key = String(frequency);
                  const gain = Number(eqBands[key] ?? 0);
                  return (
                    <label key={key} className="grid grid-cols-[64px_1fr_48px] items-center gap-3">
                      <span className="text-xs text-muted-foreground">{frequency >= 1000 ? `${frequency / 1000}k` : frequency}</span>
                      <input
                        aria-label={`${frequency}Hz`}
                        className="h-1.5 w-full cursor-pointer accent-primary"
                        max={12}
                        min={-12}
                        step={0.5}
                        type="range"
                        value={gain}
                        onChange={(event) => setEqBand(frequency, Number(event.target.value))}
                      />
                      <span className="text-right text-xs text-muted-foreground">{gain.toFixed(1)}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
