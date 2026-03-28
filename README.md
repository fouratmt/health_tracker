# Personal Health Tracker

Lightweight static browser app for daily health accountability tracking with a light-first white interface, blue and black accents, and a persistent dark-mode toggle.

## Current Capabilities

- daily check-ins for weight, steps, workouts, calories, hydration, sleep duration, sleep score, and bedtime
- configurable goals for steps, sleep duration, sleep score, workouts, calorie days, and hydration tracking
- dashboard and progress summaries for adherence, streaks, trend snapshots, slipping metrics, and recent entries
- light mode by default with a persistent dark-mode toggle
- local-only persistence with JSON export and import

## Developer Flow

This project uses a small `just` workflow instead of a build system.

- `just`: list available recipes
- `just open`: open the app directly from disk
- `just serve`: serve the project locally at `http://127.0.0.1:9292`
- `just check`: run JavaScript syntax checks
- `just dev`: run checks, then start the local static server

## Project Structure

- `docs/project-definition.md`: product definition and positioning
- `docs/prd.md`: product requirements document
- `docs/technical-architecture.md`: high-level technical architecture
- `docs/implementation-tracker.md`: current implementation status and known gaps
- `Justfile`: developer commands for local usage
- `index.html`: app entry point
- `css/styles.css`: app styles
- `js/constants.js`: metric and goal defaults
- `js/storage.js`: versioned local persistence and state normalization
- `js/calculations.js`: deterministic scoring and status logic
- `js/app.js`: UI wiring and rendering

## Runtime Constraints

- no backend
- no login
- no build step
- runs directly from disk via `file://`
- deployable to GitHub Pages
- stores all data locally in the browser

## Local Usage

Open [index.html](/Users/fourat/projects/perso/personnal_health_tracker/index.html) in a browser.

For a local dev server, run:

```sh
just dev
```

## Hosting

The app can be hosted as static files on GitHub Pages without any server component.
