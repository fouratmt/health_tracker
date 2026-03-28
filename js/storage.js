(function () {
  const { STORAGE_KEY, STORAGE_VERSION, DEFAULT_GOALS } = window.HealthTrackerConstants;

  function createDefaultState() {
    return {
      version: STORAGE_VERSION,
      goals: { ...DEFAULT_GOALS },
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
      goals: {
        ...base.goals,
        ...(candidate.goals || {}),
      },
      logs: {
        ...(candidate.logs || {}),
      },
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
