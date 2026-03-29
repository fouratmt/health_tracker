(function () {
  const { STORAGE_KEY, STORAGE_VERSION, DEFAULT_GOALS, DEFAULT_PREFERENCES } =
    window.HealthTrackerConstants;

  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeBoolean(value) {
    return value === true;
  }

  function normalizeDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  }

  function normalizeTime(value) {
    return typeof value === "string" && /^\d{2}:\d{2}$/.test(value) ? value : null;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDurationFromMinutes(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
      return null;
    }

    const roundedMinutes = Math.round(totalMinutes);
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    if (hours > 23) {
      return null;
    }

    return `${pad(hours)}:${pad(minutes)}`;
  }

  function normalizeDuration(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return formatDurationFromMinutes(value * 60);
    }

    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);

    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      return minutes < 60 ? formatDurationFromMinutes(hours * 60 + minutes) : null;
    }

    const normalizedNumber = Number(trimmed.replace(",", "."));
    return Number.isFinite(normalizedNumber) ? formatDurationFromMinutes(normalizedNumber * 60) : null;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function normalizeTheme(value) {
    return value === "dark" ? "dark" : "light";
  }

  function normalizeGoals(candidateGoals) {
    const source = candidateGoals && typeof candidateGoals === "object" ? candidateGoals : {};

    return {
      ...DEFAULT_GOALS,
      stepsMinimum: normalizeNumber(source.stepsMinimum) ?? DEFAULT_GOALS.stepsMinimum,
      sleepMinimum: normalizeDuration(source.sleepMinimum) ?? DEFAULT_GOALS.sleepMinimum,
      sleepScoreMinimum:
        normalizeNumber(source.sleepScoreMinimum) ?? DEFAULT_GOALS.sleepScoreMinimum,
      weeklyWorkoutTarget:
        normalizeNumber(source.weeklyWorkoutTarget) ?? DEFAULT_GOALS.weeklyWorkoutTarget,
      monthlyCaloriesTarget:
        normalizeNumber(source.monthlyCaloriesTarget) ?? DEFAULT_GOALS.monthlyCaloriesTarget,
      waterDaily:
        source.waterDaily === undefined ? DEFAULT_GOALS.waterDaily : normalizeBoolean(source.waterDaily),
      noSugarDaily:
        source.noSugarDaily === undefined ? DEFAULT_GOALS.noSugarDaily : normalizeBoolean(source.noSugarDaily),
      weightTrendDirection:
        typeof source.weightTrendDirection === "string"
          ? source.weightTrendDirection
          : DEFAULT_GOALS.weightTrendDirection,
    };
  }

  function normalizePreferences(candidatePreferences) {
    const source =
      candidatePreferences && typeof candidatePreferences === "object" ? candidatePreferences : {};

    return {
      ...DEFAULT_PREFERENCES,
      theme: normalizeTheme(source.theme),
    };
  }

  function normalizeLog(candidateLog, fallbackDate) {
    const source = candidateLog && typeof candidateLog === "object" ? candidateLog : {};
    const date = normalizeDate(source.date) || normalizeDate(fallbackDate);

    if (!date) {
      return null;
    }

    const sleepScore = normalizeNumber(source.sleepScore);

    return {
      date,
      weight: normalizeNumber(source.weight),
      workoutDone: normalizeBoolean(source.workoutDone),
      steps: normalizeNumber(source.steps),
      caloriesOnTarget: normalizeBoolean(source.caloriesOnTarget),
      sleepHours: normalizeDuration(source.sleepHours),
      sleepScore:
        sleepScore === null ? null : clamp(Math.round(sleepScore), 0, 100),
      bedtime: normalizeTime(source.bedtime),
      waterTargetMet: normalizeBoolean(source.waterTargetMet),
      noSugarIntake: normalizeBoolean(source.noSugarIntake),
    };
  }

  function normalizeLogs(candidateLogs) {
    const source = candidateLogs && typeof candidateLogs === "object" ? candidateLogs : {};

    return Object.keys(source).reduce(function (logs, key) {
      const normalized = normalizeLog(source[key], key);

      if (normalized) {
        logs[normalized.date] = normalized;
      }

      return logs;
    }, {});
  }

  function createDefaultState() {
    return {
      version: STORAGE_VERSION,
      preferences: normalizePreferences(DEFAULT_PREFERENCES),
      goals: normalizeGoals(DEFAULT_GOALS),
      logs: {},
    };
  }

  function normalizeState(candidate) {
    const base = createDefaultState();

    if (!candidate || typeof candidate !== "object") {
      return base;
    }

    return {
      version: STORAGE_VERSION,
      preferences: normalizePreferences(candidate.preferences || base.preferences),
      goals: normalizeGoals(candidate.goals || base.goals),
      logs: normalizeLogs(candidate.logs),
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createDefaultState();
      }

      return normalizeState(JSON.parse(raw));
    } catch (error) {
      return createDefaultState();
    }
  }

  function saveState(state) {
    const normalized = normalizeState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function exportState(state) {
    return JSON.stringify(normalizeState(state), null, 2);
  }

  function importState(jsonText) {
    const parsed = JSON.parse(jsonText);
    return saveState(parsed);
  }

  window.HealthTrackerStorage = {
    createDefaultState,
    loadState,
    saveState,
    exportState,
    importState,
  };
})();
