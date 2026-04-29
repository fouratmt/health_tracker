# Feature Implementation Tracker

Last reviewed: 2026-04-30

This tracker was derived from:

- `docs/project-definition.md`
- `docs/prd.md`
- `docs/technical-architecture.md`

Snapshot:

- The core static app shell is implemented and fully wired.
- The visual system is now light-first with white surfaces, blue and black accents, and a persistent dark-mode toggle.
- Sleep tracking now stores duration as `HH:MM` alongside sleep score and bedtime.
- Storage normalization now upgrades persisted data into schema version `5`.
- Water and no sugar are always-on daily scored rules.
- The app now includes a PWA manifest, service worker, app icons, install action, Chromium native install flow, and Safari/Firefox install guidance.
- The mobile/tablet UI has been tightened with lower-radius cards, lighter shadows, thumb-friendly phone navigation, responsive check-in controls, and horizontally scrollable heatmaps.

## Status Legend

| Status | Meaning |
| --- | --- |
| Implemented | Present and wired end-to-end in the current app |
| Partial | Some implementation exists, but the documented behavior is incomplete |
| Not started | Documented, but not implemented in runtime behavior yet |
| Out of scope | Explicitly excluded from the MVP docs or listed as future work |

## Foundations and App Shell

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Static browser app with no backend, login, or build step | PRD constraints, NFR1, NFR2 | Implemented | Plain `index.html`, `css/`, and `js/` files with no framework or backend dependency | Keep this as a hard constraint |
| Direct local-disk usage and static hosting compatibility | PRD constraints, Technical Architecture overview | Implemented | App is file-based, uses section tabs instead of routing, and has no server assumptions | Browser `localStorage` behavior under `file://` still depends on browser policy |
| Four-screen single-page layout | PRD MVP scope, Project Definition screen structure | Implemented | Dashboard, Check-In, Progress, and Goals are all present in `index.html` | End-to-end |
| Mobile-friendly layout | PRD constraints, NFR3 | Implemented | `css/styles.css` includes responsive card, tab, and form breakpoints | Still worth validating on a real phone |
| Light-first white, blue, and black visual direction | Project Definition visual direction, PRD UX requirements | Implemented | CSS tokens now default to bright surfaces with blue and black accents | Visual polish can continue, but the documented direction now matches runtime |
| Persistent dark-mode toggle | PRD FR9 | Implemented | Theme toggle updates a persisted `preferences.theme` value and swaps CSS variables at runtime | No system-theme auto-detection is implemented |
| PWA app shell | PRD FR10, NFR5, NFR6 | Implemented | `manifest.webmanifest`, `service-worker.js`, and `assets/icons/` provide install metadata, icons, and app-shell caching | Requires `localhost` or HTTPS; not available from direct `file://` |
| Browser install prompt / guidance | PRD FR10 | Implemented | `js/app.js` handles `beforeinstallprompt`, app-installed state, standalone mode, and fallback copy for Safari/Firefox | Browser support differs; Safari and Firefox require user action through browser UI |

## Goals and Metric Model

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Goals / settings screen | PRD FR1 | Implemented | Goals form exists in `index.html` and saves through `js/app.js` | End-to-end |
| Daily steps minimum goal | PRD FR1 | Implemented | Stored in `state.goals.stepsMinimum` and used in `evaluateDailyLog()` | End-to-end |
| Sleep duration minimum goal | PRD FR1 | Implemented | Stored in `state.goals.sleepMinimum` and used in `evaluateDailyLog()` | End-to-end |
| Sleep score minimum goal | PRD FR1 | Implemented | Stored in `state.goals.sleepScoreMinimum` and evaluated when a log includes `sleepScore` | Historical logs without a score are still usable |
| Weekly workout target | PRD FR1, FR4 | Implemented | Target is editable and rendered alongside weekly workout pace | Overall status still comes from adherence percentages rather than a separate workout-target rule |
| Monthly calorie target | PRD FR1, FR4 | Implemented | Monthly target days are editable and shown against current counts | End-to-end for pacing summaries |
| Always-on hydration and no-sugar rules | PRD calculation rules, FR3 | Implemented | Water and no sugar are always part of the daily evaluation instead of goal toggles | Water is documented as roughly 2 liters for a hit |
| Weight trend direction assumption | Product simplification | Implemented | Weight movement is always interpreted as better when trending down | No configuration is exposed or stored |

## Daily Check-In and Logging

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| One compact daily check-in form with MVP fields | PRD FR2 | Implemented | Form captures date, weight, steps, workout, calories, sleep duration, sleep score, bedtime, water, and no sugar | Matches the updated metric set |
| Save a full daily log in one action | PRD FR2, acceptance criteria | Implemented | `handleCheckinSubmit()` builds one payload and persists it in a single write | Dashboard summaries re-render immediately after save |
| Create or update a log for a specific date | PRD FR2 | Implemented | Logs are keyed by `payload.date`, and selecting a saved day preloads the form for editing | End-to-end |
| Selected-date summary and preview | Project Definition daily logging flow | Implemented | `renderCheckinPreview()` shows the selected-day score, status, and metric breakdown | The note now also reflects stored sleep detail |
| Bedtime tracking | Project Definition recommended metrics, PRD FR2 | Implemented | Bedtime is collected as a local `HH:MM` field and shown in entry summaries | Bedtime is informational today, not goal-driven |

## Evaluation and Summary Engine

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Daily target hit count and total applicable targets | PRD FR3 | Implemented | `evaluateDailyLog()` returns `hits`, `total`, and per-metric results | End-to-end |
| Sleep duration scoring | PRD sleep rules | Implemented | Daily evaluation compares `sleepHours` as `HH:MM` against `sleepMinimum` | Legacy decimal values are normalized on load |
| Sleep score scoring | PRD sleep rules | Implemented | Daily evaluation adds a `Sleep score` rule when `sleepScore` is present | Missing scores are treated as non-applicable instead of forced misses |
| No-sugar scoring | PRD calculation rules, FR3 | Implemented | Daily evaluation always adds `No sugar` as a binary daily rule | End-to-end |
| Per-metric hit or miss status | PRD FR3 | Implemented | Workout, steps, calories, sleep duration, sleep score, and always-on water and no-sugar rules are evaluated individually | End-to-end |
| Weekly adherence percentage | PRD FR4 | Implemented | `calculatePeriodAdherence()` computes current-week adherence | Rendered on the dashboard |
| Monthly adherence percentage | PRD FR4 | Implemented | `calculatePeriodAdherence()` computes current-month adherence | Rendered on the dashboard |
| Weight trend summary | PRD FR6 | Implemented | `calculateWeightTrend()` compares first and last recorded weigh-ins | Still a simple text summary, not a chart |
| Slipping metrics / drift detection | PRD core user stories, FR6 | Implemented | `calculateSlippingMetrics()` ranks the weakest recent metrics | Adapts automatically when sleep score is present |
| Streak tracking | PRD FR3, FR5 | Implemented | Workout streak is shown on the dashboard, and the progress heatmap exposes marker streaks for workout, steps, sleep, and no sugar | Dashboard still emphasizes workout streak only |
| Overall status model | PRD calculation rules | Implemented | `deriveOverallStatus()` uses symmetric 80% / 60% weekly and monthly adherence thresholds | Empty adherence data now defaults to `Slightly off track` instead of `On track` |

## Dashboard and Progress Visibility

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Dashboard screen with top-line summaries | PRD FR5 | Implemented | Dashboard renders score, adherence, streak, goal pacing, slipping metrics, and recent entries | End-to-end |
| Hero-level current status details | PRD FR5 | Implemented | Hero status shows current standing, logged days, latest entry, and weight trend detail | End-to-end |
| Today hit or miss breakdown | PRD FR3, FR5 | Implemented | `today-breakdown` is rendered from per-metric evaluation results | End-to-end |
| Goal pacing board | PRD FR4, FR5 | Implemented | Dashboard shows weekly workouts, monthly nutrition pacing, and the combined sleep target | End-to-end |
| Recent entries summaries | PRD FR5, FR6 | Implemented | Dashboard and Progress lists show steps plus sleep duration, score, and bedtime context | End-to-end |
| Progress trend snapshot | PRD FR6 | Implemented | Progress view shows directional cards for weight movement, steps, sleep duration, and sleep score | End-to-end |
| Marker streak map | PRD FR6 | Implemented | Progress view renders a 12-week GitHub-style map for workout, steps, sleep, and no sugar | Mobile uses horizontal overflow to preserve cell readability |
| Consistency board | Progress surface intent, FR6 | Implemented | Progress view renders adherence, workout pace, nutrition pace, sleep score target, and the always-on water and no-sugar rules | End-to-end |
| Recent adherence history over time | PRD FR6 | Partial | The app exposes current adherence summaries and pacing boards | No day-by-day adherence chart or timeline yet |
| Recent weight history | PRD FR6 | Partial | The app exposes trend text and latest weight summary | There is still no dedicated history list or chart of weigh-ins |

## Data Portability and Reliability

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Local persistence of goals and logs | PRD FR7 | Implemented | `js/storage.js` reads and writes one browser-local state document | End-to-end |
| Versioned JSON storage document | PRD data requirements | Implemented | Stored state now uses version `5` | Version upgrades are handled by normalization rather than explicit migrations |
| Imported and legacy state normalization | Technical Architecture reliability strategy | Implemented | `normalizeState()` sanitizes preferences, goals, and logs, including `sleepScore` and `bedtime` | Good baseline for backward compatibility |
| JSON export | PRD FR8 | Implemented | `handleExport()` downloads the normalized state document | End-to-end |
| JSON import | PRD FR8 | Implemented | `handleImport()` parses JSON and persists the normalized result | Invalid JSON still fails fast with a generic error message |
| Deterministic client-side calculations | PRD NFR4 | Implemented | `js/calculations.js` remains pure and DOM-free | No automated tests yet to lock behavior down |
| Offline repeat launches | PRD FR10, NFR5 | Implemented | Service worker caches the static app shell and same-origin assets | Needs browser-level manual testing across Chrome, Firefox, and Safari |

## Explicit MVP Non-Goals

These are intentionally not tracked as missing implementation work for the current MVP:

- Cloud sync
- Login and accounts
- Push notifications
- Social features
- Mood tracking
- Journaling
- Coaching content
- Wearable integrations
- Detailed workout programming

Status for all items above: Out of scope

## Suggested Next Implementation Slices

1. Add lightweight tests around `js/calculations.js`, `js/storage.js`, and service-worker cache-list integrity so the version `5` schema, theme preference, sleep rules, and PWA shell stay stable.
2. Add a simple recent-history visualization for weight and adherence over time, likely a small no-dependency SVG or HTML chart that stays static-hosting friendly.
3. Improve data management safety: confirmation before import replacement, clearer invalid-file errors, and optional “last exported” metadata.
4. Decide whether bedtime should remain informational or become a scored goal with a configurable target.
5. Run a real-device install/offline QA pass in Chrome, Firefox, and Safari, then document browser-specific findings.
6. Consider an explicit app version constant shared by docs, cache name, and storage metadata so service-worker cache invalidation is less manual.
