# Personal Health Tracker

Lightweight static browser app for daily health accountability tracking with a light-first white interface, blue and black accents, and a persistent dark-mode toggle.

## Current Capabilities

- daily check-ins for weight, steps, workouts, calories, hydration, no sugar, sleep duration, sleep score, and bedtime
- configurable goals for steps, sleep duration, sleep score, workouts, and calorie days, with always-on water and no-sugar checks
- dashboard and progress summaries for adherence, streaks, trend snapshots, slipping metrics, and recent entries
- light mode by default with a persistent dark-mode toggle
- local-only persistence with JSON export and import
- PWA manifest, offline app shell, install prompt for Chromium browsers, and add-to-home-screen guidance for Safari and Firefox

## Developer Flow

This project uses a small `just` workflow instead of a build system. Local serving is handled by uvicorn through `uvx`; no virtualenv or dependency install step is required.

- `just`: list available recipes
- `just dev`: serve the project locally at `http://127.0.0.1:9292`
- `just serve`: alias for `just dev`
- `just run`: alias for `just dev`
- `just check`: compile-check the local ASGI dev server
- `just doctor`: print local tool versions

## Project Structure

- `docs/project-definition.md`: product definition and positioning
- `docs/prd.md`: product requirements document
- `docs/technical-architecture.md`: high-level technical architecture
- `docs/implementation-tracker.md`: current implementation status and known gaps
- `Justfile`: developer commands for local usage
- `dev_server.py`: uvicorn ASGI static-file server for local development
- `index.html`: app entry point
- `css/styles.css`: app styles
- `js/constants.js`: metric and goal defaults
- `js/storage.js`: versioned local persistence and state normalization
- `js/calculations.js`: deterministic scoring and status logic
- `js/app.js`: UI wiring and rendering
- `manifest.webmanifest`: install metadata for browser PWA support
- `service-worker.js`: local offline shell cache
- `assets/icons/`: install icons for Chromium, Safari, and Firefox

## Runtime Constraints

- no production backend
- no login
- no build step
- runs directly from disk via `file://`
- deployable to GitHub Pages
- stores all data locally in the browser
- service-worker-based offline support requires `localhost` or HTTPS

## Local Usage

Use the local dev server:

```sh
just dev
```

Then open `http://127.0.0.1:9292`.

## Hosting

The app can be hosted as static files on GitHub Pages without any server component.
