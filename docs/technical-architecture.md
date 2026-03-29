# Technical Architecture

## Overview

This project is a no-backend static web application designed to run in two modes:

- directly from disk via `file://`
- as a static deployment on GitHub Pages

The architecture therefore avoids:

- server rendering
- API calls
- build tooling requirements
- login/session management
- any runtime dependency on a backend

## Architecture Goals

- keep startup and interaction latency low
- ensure deterministic calculations
- preserve compatibility with direct local file usage
- store all user data locally
- remain simple enough to inspect and maintain without a framework

## High-Level Design

The application uses a client-only architecture with four layers:

1. Presentation layer
2. Application orchestration layer
3. Domain calculation layer
4. Persistence layer

## Layer Breakdown

### 1. Presentation Layer

Files:

- `index.html`
- `css/styles.css`

Responsibilities:

- render the static layout
- expose dashboard, check-in, progress, and goals views
- provide mobile-friendly forms and cards
- display status and summaries
- apply the light-first white, blue, and black visual system
- support a persistent dark-mode override

Constraints:

- must work without client-side routing
- must degrade cleanly on narrow mobile screens

### 2. Application Orchestration Layer

Files:

- `js/app.js`

Responsibilities:

- bootstrap application state
- read from storage on load
- bind form events
- call calculation functions
- render computed outputs into the DOM
- handle import and export actions
- populate and edit per-day logs including sleep duration, sleep score, bedtime, water, and no-sugar tracking

This layer should contain wiring and UI flow logic, not business rules.

### 3. Domain Calculation Layer

Files:

- `js/constants.js`
- `js/calculations.js`

Responsibilities:

- define default metrics and target rules
- evaluate daily target hits
- compute adherence percentages
- compute streaks
- compute weight trend summary
- derive `On track`, `Slightly off track`, and `Off track` statuses from weekly and monthly adherence thresholds
- include sleep-score evaluation only when a score exists for a log

This layer is the source of truth for business logic and must remain deterministic and side-effect free.

### 4. Persistence Layer

Files:

- `js/storage.js`

Responsibilities:

- read and write application data from browser local storage
- initialize defaults for first use
- store versioned JSON
- normalize imported and legacy data, including legacy decimal sleep durations
- persist theme preferences together with the rest of the app state
- export current data snapshot

## Runtime Model

### Bootstrap Flow

1. Browser loads `index.html`
2. HTML loads plain script files in dependency order
3. `app.js` requests persisted data from `storage.js`
4. app state is hydrated with goals and logs
5. `calculations.js` derives summaries
6. UI is rendered

### Save Flow

1. user submits the daily check-in or goals form
2. `app.js` normalizes form input
3. state is updated in memory
4. `storage.js` persists the new document
5. `calculations.js` recomputes summaries
6. UI refreshes immediately

### Import Flow

1. user selects a JSON file
2. `app.js` reads the file contents
3. parsed data is normalized into the current schema
4. `storage.js` replaces the stored document
5. app re-renders from the imported state

## Data Model

The app stores a single versioned document.

Example shape:

```json
{
  "version": 5,
  "preferences": {
    "theme": "light"
  },
  "goals": {
    "stepsMinimum": 8000,
    "sleepMinimum": "07:00",
    "sleepScoreMinimum": 80,
    "weeklyWorkoutTarget": 4,
    "monthlyCaloriesTarget": 24
  },
  "logs": {
    "2026-03-28": {
      "date": "2026-03-28",
      "weight": 84.2,
      "workoutDone": true,
      "steps": 7450,
      "caloriesOnTarget": true,
      "sleepHours": "06:30",
      "sleepScore": 78,
      "bedtime": "23:20",
      "waterTargetMet": true,
      "noSugarIntake": true
    }
  }
}
```

## Storage Choice

### Primary Store

`localStorage`

Reasoning:

- supported in modern browsers
- works for small personal datasets
- simple to inspect and export
- no asynchronous database setup needed
- compatible with static hosting

### Known Limitation

`localStorage` under `file://` can behave differently by browser. The app should remain simple enough that the user can switch to a static host such as GitHub Pages if needed, and export and import support reduces lock-in risk.

## Calculation Strategy

All calculations should be:

- pure
- deterministic
- based only on stored goals and logs
- isolated from DOM code

Core calculation outputs:

- daily target results
- daily completion ratio
- weekly adherence ratio
- monthly adherence ratio
- workout streak
- slipping metrics
- weight trend
- overall status

## UI Structure

The app uses a single-page static layout with section-based navigation:

- Dashboard
- Daily Check-In
- Progress
- Goals

This avoids routing complexity and keeps compatibility with `file://`.

## Mobile Strategy

- use one-column layouts by default on small screens
- keep forms vertically stacked
- use large tap targets
- keep the most common action, daily check-in, within easy reach
- avoid hover-only interactions

## Reliability Strategy

- centralize formulas in one calculation module
- normalize input values before persistence
- normalize imported and legacy logs and preferences to the current schema version
- version stored data for future migration
- avoid floating hidden state in the UI
- re-render from state after every write

## Deployment Model

### Local Disk

The user can open `index.html` directly in a browser.

### GitHub Pages

The repository can be published as static files without code changes.

No server rewrites, environment variables, or build outputs are required.

## Future Extensions

These can be added later without changing the core architecture:

- IndexedDB for larger local datasets
- chart rendering library if still compatible with static hosting
- installable PWA packaging
- optional CSV export
- configurable metric definitions
- bedtime-target rules if the user wants them scored

## Architectural Tradeoffs

### Benefits

- low complexity
- transparent logic
- easy hosting
- privacy by default
- fast startup
