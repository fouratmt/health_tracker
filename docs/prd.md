# Product Requirements Document

## Product Name

Personal Health Tracker

## Objective

Deliver a lightweight static web app that helps a user define health targets, complete one fast daily check-in, and immediately understand whether they are on track.

## Product Summary

The app is a personal accountability tool for measurable health habits. It focuses on adherence rather than coaching. The user sets simple rules, logs once per day, and sees daily, weekly, and monthly performance in a light-first white interface with blue and black accents plus an optional dark mode.

## Primary User

A self-directed user who already knows their health plan and wants a clean accountability system instead of reminders, coaching, or journaling.

## Product Constraints

- must be a static browser app
- must run without a backend
- must store all data locally on the device
- must work when opened directly from disk via `file://`
- must be hostable on GitHub Pages
- must be installable as a PWA when served from `localhost` or HTTPS
- must not require authentication or login
- must be mobile-friendly
- must optimize for very fast daily use
- must use simple, inspectable calculation rules
- must produce reliable and deterministic summaries

## Problem To Solve

Users often lose consistency because they have no lightweight system that compares intention to actual behavior. Existing tools either create too much friction or bury accountability behind broad wellness features.

## Success Criteria

The product succeeds if a user can:

- configure initial goals in under 5 minutes
- complete a daily check-in in under 2 minutes
- understand today, this week, and this month at a glance
- trust that all displayed calculations are consistent and repeatable
- use the app entirely offline after it is loaded
- install or add the app to the home screen from Chrome, Firefox, or Safari when the browser supports it

## MVP Scope

### In Scope

- dashboard with current status and summaries
- daily check-in screen
- progress screen with simple summaries
- goals/settings screen
- local data persistence
- adherence and streak calculations
- weight trend summary
- manual data import/export
- PWA install metadata, app icons, offline shell caching, and browser-specific install guidance

### Out Of Scope

- backend APIs
- cloud sync
- login and accounts
- push notifications
- social features
- mood tracking
- journaling
- workout programming details
- wearable integrations

## Core User Stories

### Goal Setup

- As a user, I want to configure simple targets so the app knows what counts as success.

### Daily Accountability

- As a user, I want to enter my daily results quickly so I can keep the habit sustainable.

### Progress Visibility

- As a user, I want the app to tell me if I am on track this week and month without interpretation.

### Installable Use

- As a user, I want to install the app or add it to my home screen so the tracker feels like a small private utility rather than a website I need to find again.

### Drift Detection

- As a user, I want to see which metric is slipping first so I can correct early.

### Local Ownership

- As a user, I want my data to stay in my browser so I can use the app privately without creating an account.

## Functional Requirements

### FR1. Goal Management

The app must allow the user to define and update active targets for:

- weight trend
- weekly workout count
- daily step minimum
- calorie adherence
- sleep minimum
- sleep score minimum

### FR2. Daily Check-In

The app must provide a daily entry form with the following fields:

- date
- weight
- workout done
- steps
- calories on target
- sleep duration (`HH:MM`)
- sleep score
- bedtime
- water target met
- no sugar intake

The app must allow creating or updating a log for a specific date.

### FR3. Daily Evaluation

After saving a log, the app must compute:

- targets hit today
- total applicable targets today
- per-metric hit or miss status
- current streaks
- overall daily status

The daily evaluation must treat sleep duration as a scored rule, and it must add a separate sleep-score rule when a sleep score is present for that day.

### FR4. Weekly and Monthly Evaluation

The app must compute:

- weekly adherence percentage
- monthly adherence percentage
- workout count versus weekly target
- monthly hit counts for binary adherence goals

### FR5. Dashboard

The dashboard must display:

- overall status
- today’s completion score
- current weekly adherence
- current monthly adherence
- active streaks
- quick metric summaries

### FR6. Progress View

The progress view must display:

- recent weight movement
- recent adherence summaries
- recent sleep duration change
- recent sleep score change
- recent bedtime visibility
- recent steps change
- slipping metrics summary
- 12-week marker history for workout, steps, sleep, and no sugar

### FR7. Local Persistence

The app must persist user settings and logs locally in browser storage.

### FR8. Import and Export

The app must let the user export all data as JSON and import it back later.

### FR9. Theme Preference

The app must:

- default to a light theme with a whitish background
- use blue and black as the primary accent colors
- provide a dark-mode toggle
- persist the active theme locally so it survives reloads and data export or import

### FR10. PWA Install and Offline Shell

The app must:

- include a valid web app manifest
- include install icons for Chromium, Safari, and Firefox surfaces
- register a service worker when served from a secure context or `localhost`
- cache the app shell for repeat use without network access
- expose an install action in the UI
- use the native Chromium install prompt when `beforeinstallprompt` is available
- show Safari and Firefox add-to-home-screen guidance when native prompting is not available

## Non-Functional Requirements

### NFR1. Direct Browser Usage

The core app must work when the user opens `index.html` directly from local disk in a modern browser. Service-worker caching and browser install behavior are not expected under `file://`.

### NFR2. No Build Requirement

The project must remain usable without a build pipeline or package installation.

### NFR3. Mobile-Friendly Layout

The interface must remain usable on common mobile viewport sizes.

### NFR4. Deterministic Calculations

All scoring and status outputs must be derived from explicit client-side rules with no hidden server dependency.

### NFR5. Offline-First

The core application must work without network access after the static files are available locally. When served from `localhost` or HTTPS, the service worker must cache the shell for repeat offline launches.

### NFR6. Browser Install Compatibility

The app must remain install-friendly in current Chrome, Firefox, and Safari behavior:

- Chrome and other Chromium browsers should receive native install prompting when the browser exposes it.
- Safari should receive clear add-to-home-screen guidance.
- Firefox should receive clear install or add-to-home-screen guidance where the browser exposes that option.

## Data Requirements

### Stored Data

The app must store:

- user preferences
- goals/settings
- daily logs
- derived metadata version

### Data Format

Data should be stored as a versioned JSON document inside browser local storage to simplify export, import, and migration.

Daily log records should support:

- `sleepHours`: `HH:MM` string or `null`
- `sleepScore`: integer from 0 to 100 or `null`
- `bedtime`: `HH:MM` or `null`
- `noSugarIntake`: boolean
- `preferences.theme`: `"light"` or `"dark"`

## Calculation Rules

### Daily Score

Daily score is:

`number_of_targets_hit / number_of_applicable_targets`

### Weekly Adherence

Weekly adherence is the sum of target hits divided by the sum of applicable targets across the current week.

### Monthly Adherence

Monthly adherence is the sum of target hits divided by the sum of applicable targets across the current month.

### Sleep Rules

- sleep duration is always evaluated against `sleepMinimum`
- sleep score is evaluated against `sleepScoreMinimum` only when a score exists for that log
- bedtime is stored and shown in summaries, but is not yet a scored rule
- water is always evaluated as a binary daily rule; a hit means around 2 liters for the day
- no sugar is always evaluated as a binary daily rule

### Status Model

The app must use a three-state status model:

- `On track`
- `Slightly off track`
- `Off track`

Thresholds:

- `On track` when both weekly and monthly adherence are at least 80%
- `Off track` when both weekly and monthly adherence are below 60%
- `Slightly off track` otherwise

When there is no current weekly or monthly adherence data yet, the app should default to `Slightly off track` rather than `On track`.

## UX Requirements

- daily logging must be the shortest path in the app
- the app must avoid visual clutter
- the app must privilege readability over decoration
- the app must make hits, misses, and drift easy to scan
- the app must default to a light, high-contrast interface with blue and black accents
- the app must offer a dark mode without changing information density or layout
- the app must avoid multi-step onboarding or setup flows

## Acceptance Criteria

### Daily Check-In

- user can save a full day log in one form
- saved entries remain available after browser reload
- dashboard updates immediately after save

### Goal Management

- user can update numeric and boolean-based targets
- updated targets affect future calculations immediately

### Reliability

- given the same goals and logs, the app always computes the same summaries
- all summaries work without network access

### Portability

- app works when opened from local disk
- user can export a JSON backup
- user can import that backup in another browser session

### PWA

- manifest is available at `manifest.webmanifest`
- service worker registers without console errors on `localhost` or HTTPS
- install UI appears outside standalone mode
- Safari and Firefox guidance is available when native install prompting is unavailable
