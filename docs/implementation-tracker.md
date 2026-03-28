# Feature Implementation Tracker

Last reviewed: 2026-03-28

This tracker was derived from:

- `docs/project-definition.md`
- `docs/prd.md`
- `docs/technical-architecture.md`

Snapshot:

- The core static app shell is in place.
- Local persistence, JSON export/import, daily logging, and the main adherence calculations exist.
- Several documented surfaces are only partially wired: goal pacing, selected-date review, dashboard secondary cards, and progress consistency details.
- Some goals exist in state or UI but are not yet used end-to-end in calculations or rendering.

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
| Four-screen single-page layout | PRD MVP scope, Project Definition screen structure, Technical Architecture UI structure | Implemented | `index.html` exposes Dashboard, Check-In, Progress, and Goals tabs | Several screen areas are still placeholders |
| Mobile-friendly layout | PRD constraints, NFR3, Technical Architecture mobile strategy | Implemented | `css/styles.css` has responsive layout changes at `900px` and `560px` | Still worth validating on an actual phone |
| Offline-first and local-only runtime | PRD constraints, NFR5, Technical Architecture storage choice | Implemented | Runtime uses `localStorage` and contains no network calls | Export is still needed for durable backup |
| Deterministic client-side calculations | PRD NFR4, Technical Architecture calculation strategy | Implemented | `js/calculations.js` centralizes scoring and status logic in pure functions | No automated tests yet to lock behavior down |

## Goals and Metric Model

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Goals / settings screen | PRD MVP scope, FR1 | Implemented | Goals form exists in `index.html` and saves through `js/app.js` | Form is present and functional |
| Daily steps minimum goal | PRD FR1 | Implemented | Stored in `state.goals.stepsMinimum` and used in `evaluateDailyLog()` | End-to-end |
| Sleep minimum goal | PRD FR1 | Implemented | Stored in `state.goals.sleepMinimum` and used in `evaluateDailyLog()` | End-to-end |
| Daily hydration goal toggle | PRD FR1 | Implemented | `waterDaily` controls whether water is included in daily evaluation | End-to-end for the current model |
| Weekly workout target | PRD FR1, FR4 | Partial | Goal is editable and weekly workout count is computed in `buildSummary()` | The target is not compared against the count anywhere in the UI or summary status |
| Calorie adherence goal | PRD FR1, FR4 | Partial | UI stores `monthlyCaloriesTarget` and calculations count monthly calorie hit days | Saved target is not used to determine pacing or success |
| Protein adherence goal | PRD FR1, FR4 | Partial | UI stores `monthlyProteinTarget` and calculations count monthly protein hit days | Saved target is not used to determine pacing or success |
| Weight trend goal | PRD FR1, Project Definition goal model | Partial | `DEFAULT_GOALS` includes `weightTrendDirection: "down"` | There is no goals UI for trend direction and no evaluation uses it |
| Supported goal types (`binary`, `minimum`, `range`, `frequency`, `trend`) | Project Definition functional model | Partial | The current app supports pieces of `binary`, `minimum`, and some `frequency`/`trend` scaffolding | `range` is not implemented and the broader goal-type model is not formalized yet |

## Daily Check-In and Logging

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| One compact daily check-in form with MVP fields | PRD FR2, Project Definition daily logging flow | Implemented | Form captures date, weight, workout, steps, calories, protein, sleep, and water | Matches the documented metric set |
| Save a full daily log in one action | PRD acceptance criteria, FR2 | Implemented | `handleCheckinSubmit()` builds one payload and persists it in a single write | Dashboard summaries re-render immediately after save |
| Create or update a log for a specific date | PRD FR2 | Partial | Logs are keyed by `payload.date`, so saving the same date overwrites that entry | The form always resets the date to today during render and does not preload existing values for the selected date |
| Fast daily review flow | Project Definition principles, PRD success criteria | Partial | Main form is compact and single-page | The selected-date review panel exists in HTML but is not wired, so the full review loop is incomplete |
| Selected-date summary and preview | Project Definition daily logging flow, Check-In UX | Partial | `index.html` has `selected-date-*` elements and a preview card | `js/app.js` never populates that preview state |

## Evaluation and Summary Engine

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Daily target hit count and total applicable targets | PRD FR3, daily score rule | Implemented | `evaluateDailyLog()` returns `hits`, `total`, and per-metric results | End-to-end for the current metric set |
| Per-metric hit/miss status | PRD FR3 | Implemented | Workout, steps, calories, protein, sleep, and optional water are evaluated individually | End-to-end |
| Weekly adherence percentage | PRD FR4 | Implemented | `calculatePeriodAdherence()` computes the current-week percentage | Rendered on the dashboard |
| Monthly adherence percentage | PRD FR4 | Implemented | `calculatePeriodAdherence()` computes the current-month percentage | Rendered on the dashboard |
| Weight trend summary | PRD MVP scope, FR6 | Implemented | `calculateWeightTrend()` compares first and last recorded weigh-ins | Current implementation is simple first-vs-last, not a smoothed trend |
| Slipping metrics / drift detection | PRD core user stories, FR6, Technical Architecture outputs | Implemented | `calculateSlippingMetrics()` ranks the weakest recent metrics over the last 14 logged days | Currently surfaced on the dashboard |
| Overall status model (`On track`, `Slightly off track`, `Off track`) | PRD calculation rules, Technical Architecture domain layer | Implemented | `deriveOverallStatus()` maps weekly and monthly adherence to the status model | End-to-end for the current summary logic |
| Streak tracking | PRD MVP scope, FR3, Project Definition gamification | Partial | `calculateStreak()` exists and the app exposes `workoutStreak` | Only workout streak is shown; there are no broader active streaks yet |
| Current streaks across tracked metrics | PRD FR3, FR5 | Partial | Streak infrastructure exists | Missing per-metric streaks and a combined active-streak view |
| Workout count versus weekly target | PRD FR4 | Partial | `buildSummary()` computes `weeklyWorkoutCount` | No comparison against `weeklyWorkoutTarget` is rendered |
| Monthly hit counts for binary adherence goals | PRD FR4 | Partial | `buildSummary()` computes `monthlyCaloriesHits` and `monthlyProteinHits` | Counts are not shown in the UI and are not compared to saved goals |
| Overall daily status | PRD FR3 | Partial | The app has a global overall status | There is no distinct selected-day status beyond the aggregate app-level status |

## Dashboard and Progress Visibility

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Dashboard screen with top-line summaries | PRD MVP scope, FR5 | Partial | Dashboard exists and shows score, weekly adherence, monthly adherence, and workout streak | Several secondary dashboard widgets are present in HTML but not rendered |
| Today completion score | PRD FR5 | Implemented | `today-score` is rendered from `summary.todayEvaluation` | End-to-end |
| Today hit/miss breakdown | PRD FR3, FR5 | Implemented | `today-breakdown` is rendered from per-metric evaluation results | End-to-end |
| Weekly and monthly adherence on the dashboard | PRD FR5 | Implemented | Both values are rendered in the top metric cards | End-to-end |
| Active streaks on the dashboard | PRD FR5 | Partial | Workout streak card exists | Other active streaks are missing |
| Quick metric summaries | PRD FR5 | Partial | Today breakdown and slipping metrics are rendered | Goal pacing, hero facts, and dashboard recent entries are still placeholders |
| Hero-level current status details | PRD FR5 | Partial | Hero status area exists in `index.html` | `status-chip`, `logged-days`, `latest-entry`, and `weight-trend-detail` are not updated in `js/app.js` |
| Goal pacing board | Dashboard summary intent, FR4, FR5 | Partial | `index.html` includes `weekly-goal-board` | No render logic currently fills it |
| Dashboard recent entries card | FR5 quick summaries | Partial | `index.html` includes `dashboard-recent-entries` | No render logic currently fills it |
| Progress screen | PRD MVP scope, FR6 | Partial | Progress tab exists | Only part of the documented content is wired |
| Average sleep | PRD FR6 | Implemented | Computed from recent entries and rendered in `trend-summary` | End-to-end |
| Average steps | PRD FR6 | Implemented | Computed from recent entries and rendered in `trend-summary` | End-to-end |
| Recent entries list | FR6 recent history | Implemented | `recent-entries` renders the last seven saved logs | Good baseline for recent history |
| Recent weight history | PRD FR6 | Partial | The app shows a textual weight-trend summary | There is no actual recent weight history list or chart yet |
| Recent adherence history | PRD FR6 | Not started | No current render of adherence-over-time history | `consistency-board` is still empty |
| Progress consistency board | Progress surface in `index.html` | Partial | `index.html` includes `consistency-board` | No render logic currently fills it |

## Data Portability and Reliability

| Feature | Docs | Status | Current implementation | Gap or note |
| --- | --- | --- | --- | --- |
| Local persistence of goals and logs | PRD FR7, Technical Architecture persistence layer | Implemented | `js/storage.js` reads and writes one browser-local state document | End-to-end |
| Versioned JSON storage document | PRD data requirements, Technical Architecture data model | Implemented | Stored state includes `version` and default normalization | Version exists, but no migration path is needed yet |
| JSON export | PRD FR8 | Implemented | `handleExport()` downloads `storage.exportState(state)` | End-to-end |
| JSON import | PRD FR8 | Partial | `handleImport()` reads a file and passes parsed JSON into storage | Import only validates JSON syntax, not the data shape beyond normalization |
| Safe import behavior | Technical Architecture persistence responsibilities | Partial | Invalid JSON is rejected | Malformed-but-valid objects can still be accepted with minimal validation |
| Input normalization before persistence | Technical Architecture reliability strategy | Partial | Numeric form fields are normalized in `js/app.js` and state is normalized in `js/storage.js` | Imported logs are not deeply sanitized and existing values are not normalized per field |
| Re-render from state after every write | Technical Architecture reliability strategy | Implemented | `saveAndRender()` re-renders after save, and import also calls `render()` | End-to-end |

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

## Future Extensions

These are documented as later options, not current implementation gaps:

| Feature | Docs | Status | Note |
| --- | --- | --- | --- |
| IndexedDB for larger datasets | Technical Architecture future extensions | Out of scope | Future storage upgrade, not part of the MVP |
| Chart rendering library | Technical Architecture future extensions | Out of scope | Could support better trend history later |
| Installable PWA packaging | Technical Architecture future extensions | Out of scope | Not currently present |
| Optional CSV export | Technical Architecture future extensions | Out of scope | JSON export exists today |
| Configurable metric definitions | Technical Architecture future extensions | Out of scope | Current metric set is fixed |

## Suggested Next Implementation Slices

1. Wire the currently empty UI surfaces: `weekly-goal-board`, `dashboard-recent-entries`, `consistency-board`, and the selected-date preview card.
2. Make goal targets matter end-to-end by comparing weekly workouts and monthly calorie/protein hit counts against their saved goals.
3. Finish the per-date editing flow by loading existing values when the check-in date changes.
4. Expand streak tracking beyond workouts so the dashboard can show real active streaks.
5. Add lightweight validation tests around `js/calculations.js` and `js/storage.js` to lock down the deterministic rules.
