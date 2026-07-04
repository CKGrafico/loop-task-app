# Project History — loop-task-app

> Archive of context and decisions already made before agent-driven workflow was
> introduced. Captured during brownfield initialization so future agents inherit
> the reasoning behind the current codebase.

## What this project is

**Loop Task App** is a desktop (Electron) manager for [loop-task](https://github.com/CKGrafico/loop-task)
daemons. A user registers one or more running loop-task instances by their HTTP
API URL (e.g. `http://127.0.0.1:8845`) and monitors their loops, tasks,
projects, and live logs from a single window.

- **Version:** 0.1.0 (v1)
- **Scope (v1):** read-only. Register instances, list loops (polled every 5s),
  view per-loop metadata, and follow logs live via SSE. No pause/trigger/edit
  actions yet.

## Tech stack

- **Shell:** Electron 37, built with electron-vite 4.
- **UI:** React 19 + strict TypeScript 5.8, plain CSS design tokens
  (`src/renderer/src/theme.css`). No CSS framework, no state library.
- **Build/tooling:** Vite 7, pnpm (Node >= 20). Type checking via project
  references (`tsconfig.node.json`, `tsconfig.web.json`).
- **Process model:** three-layer Electron —
  `main` (`src/main/index.ts`), `preload` (`src/preload/index.ts` via
  contextBridge), `renderer` (`src/renderer/src/**`). Shared IPC contract in
  `src/shared/ipc.ts`.

## Key decisions already made

- **All HTTP runs in the main process.** The loop-task daemon sends no CORS
  headers, so a renderer-side `fetch` would be blocked. Main-process fetch also
  works unchanged for daemons on remote machines. The renderer stays sandboxed
  (`contextIsolation: true`, `nodeIntegration: false`).
- **Two IPC channels only:** `api:request` (REST, unwraps the loop-task
  `{ ok, data }` / `{ ok, error }` envelope) and `stream:subscribe` /
  `stream:unsubscribe` (a minimal SSE client in main that forwards `data:` /
  `event:` lines to the renderer via `webContents.send`).
- **Loops are polled, logs are pushed.** The loop list refreshes every 5s (the
  daemon's `/api/events` stream is not fed server-side yet). Log following is
  true push via SSE (`/api/loops/:id/logs/stream`).
- **Mock adapter for browser dev.** When `window.api` is absent (plain browser
  via `pnpm dev:web`), `src/renderer/src/mock.ts` serves fake
  loops/projects/tasks/logs and a synthetic log stream, so the UI can be built
  and screenshotted without Electron or a daemon.
- **Local-only persistence.** Registered instances and selection live in
  `localStorage` (`store.ts`); window bounds persist to a JSON file in the
  Electron `userData` dir (`main/index.ts`). No backend of its own.
- **Domain types mirror loop-task.** `src/renderer/src/types.ts` is a hand-kept
  subset of the loop-task daemon's types (source of truth: loop-task
  `src/types.ts` + `GET /api/openapi.json`).
- **Design language.** Dark, HTB-style theme: navy panels, lime-green
  (`#9fef00`) accent, floating rounded panels with hairline borders, a
  segmented pill switcher (Loops / Tasks / Projects), and a prompt-box style
  bottom filter bar. Loop status colors are matched to the loop-task TUI so both
  products read the same.
- **Single-instance app** with a custom hidden titlebar + Windows overlay
  controls; external links open in the system browser.

## Known constraints / tech debt

- **Remote instances need port forwarding.** The loop-task daemon binds its HTTP
  API to `127.0.0.1` only, so managing a daemon on another machine currently
  requires an SSH tunnel (`ssh -L 8846:127.0.0.1:8845 …`). A configurable bind
  address in loop-task would remove this (upstream work).
- **Polling, not events.** The 5s loop poll is a stopgap until the daemon's
  `/api/events` SSE is fed server-side.
- **Read-only.** No mutation actions (pause / resume / trigger / edit / delete)
  exist yet.
- **Hand-maintained type mirror.** `types.ts` can drift from the loop-task API;
  there is no codegen from `openapi.json`.
- **No test suite** and no CI pipeline in the repo at this point.

## Current state

Functional v1: instance registry with health dots, live loop list with
filtering, loop detail with metadata grid, and a live-following log viewer with
copy + autoscroll. Runs as a desktop app (`pnpm dev`) or as a mocked
browser preview (`pnpm dev:web`).
