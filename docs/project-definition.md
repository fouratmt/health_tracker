# Personal Health Tracker

## Project Definition

### Vision

Build a minimalist personal accountability app for health and fitness.

The product is not a coach, journal, or motivation engine. Its job is simpler:

> Define concrete targets, log once per day, and show clearly whether the user is on track.

### Product Goal

The app should help a user:

- define a small set of measurable health goals
- record actual results in one daily check-in
- evaluate adherence at daily, weekly, and monthly levels
- identify early drift before goals are missed for too long

### Product Positioning

This is a personal accountability tracker, not a wellness lifestyle app.

It should feel:

- concrete
- fast
- low-friction
- clear
- mildly gamified through consistency, not entertainment

## Product Principles

### 1. Concrete Metrics Only

Track measurable outcomes and behaviors, not vague states.

In scope:

- weight
- steps
- sleep duration
- workout completed
- calories on target
- protein on target
- water target met

Out of scope:

- mood
- motivation
- intention
- energy level
- journaling

### 2. One Check-In Per Day

The primary interaction is a single daily review, ideally in the evening.

The app should avoid multiple check-ins, frequent prompts, or scattered logging flows.

### 3. Fast Input

The full daily log should take 1 to 2 minutes maximum.

### 4. Few Metrics, High Signal

The app should prioritize a small number of metrics that directly support accountability.

### 5. Status Must Be Obvious

At any moment, the app should answer:

- Did I do what I planned today?
- Am I on track this week?
- Am I on track this month?
- Which area is slipping?

### 6. Lightweight Gamification

Allowed:

- streaks
- adherence percentages
- visible progress
- on-track status

Not allowed:

- badges
- fantasy mechanics
- reward systems
- coaching narratives

## Problem Statement

Most health apps either:

- track too much and create friction
- focus on motivation instead of accountability
- log data without evaluating whether the user is actually staying consistent

This product solves that by creating a simple daily system that compares goals against actual behavior and makes adherence visible.

## Target User

The target user is someone who already knows what they should be doing and does not need coaching.

They need:

- a clear structure
- a fast daily log
- proof of consistency or inconsistency
- a dashboard that makes drift obvious

## MVP Scope

### Core Capabilities

The MVP must support:

- goal definition
- daily logging
- automatic goal evaluation
- streak tracking
- weekly and monthly adherence summaries
- trend visibility for key metrics

### Recommended MVP Metrics

The first version should support these metrics:

- `weight`: numeric
- `workout_done`: boolean
- `steps`: integer
- `calories_on_target`: boolean
- `protein_on_target`: boolean
- `sleep_hours`: numeric
- `water_target_met`: boolean

If the MVP needs to be reduced further, the first six metrics are enough.

## Functional Model

The product should be built around three layers.

### 1. Metrics

Metrics are the raw things recorded by the user each day.

### 2. Goals

Goals define what success means for each metric.

Supported goal types:

- `binary`
- `minimum`
- `range`
- `frequency`
- `trend`

### 3. Evaluation

The app compares logged data to goals and calculates:

- daily completion
- streaks
- weekly adherence
- monthly adherence
- overall status

This evaluation layer is the core product value.

## Why Adherence Matters Most

The app should emphasize adherence over raw outcomes.

Reason:

- outcomes like weight change slowly
- adherence shows whether the system is working right now

The main product signal should therefore come from consistency in:

- workouts
- nutrition targets
- steps
- sleep
- hydration

## Daily Logging Flow

### Main User Flow

The primary flow should be a single evening check-in:

1. Enter weight
2. Mark workout done or not
3. Enter steps
4. Mark calories target hit or not
5. Mark protein target hit or not
6. Enter sleep hours
7. Mark water target met or not
8. View instant daily summary

## Screen Structure

The MVP should stay limited to four screens:

- Dashboard
- Daily Check-In
- Progress
- Goals / Settings

## Non-Goals

The following should remain out of scope for the first version:

- mood tracking
- journaling
- coaching content
- detailed workout programming
- multiple reminders per day
- recovery systems
- phase-based plans
- badges and collectible mechanics
- social features

## Final Product Summary

This project is a minimalist health accountability tracker built around measurable goals, one daily check-in, adherence scoring, streaks, and clear weekly/monthly progress visibility.
