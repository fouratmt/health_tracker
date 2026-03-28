# Personal Health Tracker

Lightweight static browser app for daily health accountability tracking.

## Developer Flow

This project uses a small `just` workflow instead of a build system.

- `just`: list available recipes
- `just open`: open the app directly from disk
- `just serve`: serve the project locally at `http://127.0.0.1:8000`
- `just check`: run JavaScript syntax checks
- `just dev`: run checks, then start the local static server

## Project Structure

- `docs/project-definition.md`: product definition and positioning
- `docs/prd.md`: product requirements document
- `docs/technical-architecture.md`: high-level technical architecture
- `Justfile`: developer commands for local usage
- `index.html`: app entry point
- `css/styles.css`: app styles
- `js/constants.js`: metric and goal defaults
- `js/storage.js`: local persistence
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
