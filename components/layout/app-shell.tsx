"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { motion } from "framer-motion";

import { AudioEngine } from "@/components/player/audio-engine";
import { MiniPlayer } from "@/components/player/mini-player";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const uiMode = usePlayerStore((state) => state.uiMode);

  React.useEffect(() => {
    document.body.dataset.uiMode = uiMode;
    document.body.dataset.homeBg = pathname === "/" ? "true" : "false";
  }, [pathname, uiMode]);

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <AudioEngine />
      <Image
        alt=""
        className="pointer-events-none fixed inset-0 -z-10 object-cover object-center"
        fill
        priority
        sizes="100vw"
        src="/roninbg.png"
        unoptimized
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-red-950/55 via-black/35 to-black/70" />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-8 pb-32 sm:px-6 lg:px-8 overflow-y-auto min-h-0">
        <motion.div
          key={pathname}
          initial={uiMode === "coding" ? false : { opacity: 0, y: 12 }}
          animate={uiMode === "coding" ? undefined : { opacity: 1, y: 0 }}
          transition={uiMode === "coding" ? undefined : { duration: 0.28, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="glass-panel fixed inset-x-3 bottom-4 z-[75] mx-auto max-w-2xl rounded-[30px] px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {navigationItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] text-muted-foreground transition",
                  isActive && "bg-white/10 text-foreground"
                )}
              >
                <Icon className="size-5" />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <MiniPlayer />
    </div>
  );
}
