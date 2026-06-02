# MuzicBlast

MuzicBlast is a single-user, ad-free personal music player built with Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Prisma, SQLite, Zustand, React Query, Framer Motion, and a provider-based yt-dlp integration layer.

## Phase Status

Phase 1 creates the production project structure, dark Apple Music inspired design system, responsive app shell, navigation, PWA manifest, Prisma schema, and provider interfaces. Later phases will wire playback, search, persistence, lyrics, equalizer, sleep timer, and downloads into this foundation.

Phase 2 adds the global Zustand audio architecture: a persisted queue, current track state, shuffle, repeat, seek requests, previous/next behavior, volume/mute, a browser audio engine, mini player, and queue drawer. Tracks are still expected to receive resolved audio streams from the provider/API layer in later phases.

## Install

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open http://localhost:3000.

## yt-dlp

Install `yt-dlp` on the host machine and set `YTDLP_PATH` in `.env` if it is not available on the system path.

Windows options:

```powershell
winget install yt-dlp.yt-dlp
```

Or download the official `yt-dlp.exe`, place it somewhere stable, and set:

```env
YTDLP_PATH="C:\\path\\to\\yt-dlp.exe"
```

The search API never returns mock results. If `yt-dlp` is unavailable, `/api/search` returns `503` with setup guidance.

## Structure

```text
app/          Next.js App Router pages and route handlers
components/   Reusable layout and shadcn/ui components
hooks/        Client hooks
lib/          Shared utilities and constants
prisma/       SQLite data model
server/       Server-only provider construction
services/     Provider contracts for YouTube, search, audio, and lyrics
public/       PWA manifest and app assets
```
