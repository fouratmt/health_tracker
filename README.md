# Personal Health Tracker

Lightweight static browser app for daily health accountability tracking.

## Project Structure

- `docs/project-definition.md`: product definition and positioning
- `docs/prd.md`: product requirements document
- `docs/technical-architecture.md`: high-level technical architecture
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

## Hosting

The app can be hosted as static files on GitHub Pages without any server component.
